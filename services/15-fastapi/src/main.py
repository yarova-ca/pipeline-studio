from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from dotenv import load_dotenv
import os
import sys
import uuid

from src.db.active import get_db
from src.logger import logger
from src.compliance.active import apply_compliance
from src.observability.active import init_observability

load_dotenv()

# ── JWT_SECRET startup validation ─────────────────────────────────────────────
_jwt_secret = os.getenv("JWT_SECRET", "")
if len(_jwt_secret) < 32:
    print("FATAL: JWT_SECRET missing or shorter than 32 chars", flush=True)
    sys.exit(1)

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
app.add_middleware(SlowAPIMiddleware)

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
        if os.getenv("IS_PRODUCTION", "false").lower() == "true":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
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

# ── Compliance / Observability axis ──────────────────────────────────────────
init_observability(app)
apply_compliance(app)

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
