from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from dotenv import load_dotenv
import os
import uuid

from src.db.session import get_db
from src.logger import logger

load_dotenv()

# ── OpenTelemetry — guarded by OTEL_ENABLED=true ─────────────────────────────
# Set OTEL_ENABLED=true and OTEL_EXPORTER_OTLP_ENDPOINT in the environment to
# enable trace export. Skipped silently when the env var is absent so the
# service starts without an OTel collector in local/dev mode.
if os.getenv("OTEL_ENABLED", "").lower() == "true":
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

    _provider = TracerProvider()
    _provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(_provider)
    FastAPIInstrumentor().instrument()
    logger.info("otel_enabled", endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "default"))

# ── Rate limiter ──────────────────────────────────────────────────────────────
# 100 requests per minute per IP.
# Health endpoints are not limited — k8s probes must always pass.
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="FastAPI Service",
    version="1.0.0",
    openapi_tags=[
        {"name": "auth", "description": "Authentication endpoints"},
        {"name": "users", "description": "User and item CRUD"},
        {"name": "health", "description": "Health check endpoints"},
    ],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
)


# ── Security headers ──────────────────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ── Request ID ────────────────────────────────────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


app.add_middleware(RequestIDMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────
from src.routers.auth import router as auth_router  # noqa: E402
from src.routers.users import router as users_router  # noqa: E402

app.include_router(auth_router)
app.include_router(users_router)


# ── Request logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None,
    )
    response = await call_next(request)
    return response


# ── Core routes ───────────────────────────────────────────────────────────────

@app.get("/")
def hello() -> dict:
    return {"message": "Hello from FastAPI 0.115", "framework": "15-fastapi", "version": "1.0.0"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}


# The active industry profile and the controls in effect. Switch with
# COMPLIANCE_PROFILE — this endpoint proves the controls changed, no rebuild.
@app.get("/compliance")
def compliance_status() -> dict:
    from src.compliance import compliance

    return compliance.view()


@app.get("/health/live")
def liveness() -> dict:
    return {"status": "ok"}


# DB-checking readiness probe.
# Returns 503 when the database is unreachable so k8s removes the pod
# from the load balancer until the connection recovers.
@app.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception:
        raise HTTPException(
            status_code=503,
            detail={"status": "error", "db": "disconnected"},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))


# ── I-13: Prometheus metrics (golden signals) ─────────────────────────────────
import time  # noqa: E402
from prometheus_client import Histogram, generate_latest, CONTENT_TYPE_LATEST  # noqa: E402
from starlette.responses import Response as _Resp  # noqa: E402

HTTP_DURATION = Histogram(
    "http_request_duration_seconds", "HTTP request duration in seconds",
    ["method", "path", "status"],
)


@app.middleware("http")
async def _metrics_mw(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    HTTP_DURATION.labels(request.method, request.url.path, str(response.status_code)).observe(
        time.perf_counter() - start
    )
    return response


@app.get("/metrics")
def metrics() -> _Resp:
    return _Resp(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ── I-9: unhandled errors never leak a stack trace to the client ──────────────
from fastapi.responses import JSONResponse  # noqa: E402


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.error("unhandled_error", path=request.url.path, error=type(exc).__name__)
    return JSONResponse(status_code=500, content={"statusCode": 500, "error": "Internal server error"})
