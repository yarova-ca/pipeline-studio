from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
import os

from src.db.session import get_db
from src.logger import logger

load_dotenv()

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
