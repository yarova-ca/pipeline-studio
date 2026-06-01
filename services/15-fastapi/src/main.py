from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="FastAPI 0.115")

# ── Routers ───────────────────────────────────────────────────────────────────
from src.routers.auth import router as auth_router  # noqa: E402
from src.routers.users import router as users_router  # noqa: E402

app.include_router(auth_router)
app.include_router(users_router)


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


@app.get("/health/ready")
def readiness() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
