"""Starlette auth helper — resolve authenticated user from request.

Resolution order:
1. Bearer JWT in Authorization header.
2. X-API-Key header (async DB lookup).

When both are missing or invalid: raises HTTP 401 via JSONResponse.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request
from starlette.responses import JSONResponse

from src.auth.jwt import verify_token
from src.db.models import User


async def get_current_user(request: Request, db: AsyncSession) -> Optional[dict]:
    """Return user dict from JWT or API key. Returns None if both fail."""
    auth_header = request.headers.get("Authorization", "")
    api_key = request.headers.get("X-API-Key", "")

    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        payload = verify_token(token)
        if payload is not None:
            return {
                "id": int(payload["sub"]),
                "email": payload["email"],
                "name": payload["name"],
                "provider": payload.get("provider", "github"),
            }

    if api_key:
        result = await db.execute(select(User).where(User.api_key == api_key))
        user: Optional[User] = result.scalars().first()
        if user is not None:
            return {"id": user.id, "email": user.email, "name": user.name, "provider": user.provider}

    return None


UNAUTHORIZED = JSONResponse(
    {"error": "Authentication required. Provide Bearer token or X-API-Key header."},
    status_code=401,
)
