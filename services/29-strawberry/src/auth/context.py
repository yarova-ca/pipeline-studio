"""Strawberry GraphQL context factory — builds per-request context.

Resolution order:
  1. Authorization: Bearer <JWT> header — verified without a DB hit.
  2. X-API-Key header — DB lookup via SQLAlchemy.

When auth succeeds: context["user"] is a dict with id, email, name, provider.
When auth fails or is missing: context["user"] is None.
  Protected resolvers must check context["user"] and raise PermissionError.
"""

from typing import Any, Optional

from fastapi import Request
from sqlalchemy.future import select

from src.auth.jwt import verify_token
from src.db.models import User
from src.db.session import AsyncSessionLocal


async def build_context(request: Request) -> dict[str, Any]:
    """Build the Strawberry GraphQL context for a request."""
    auth_header: Optional[str] = request.headers.get("authorization")
    api_key: Optional[str] = request.headers.get("x-api-key")

    # --- Attempt 1: Bearer JWT ---
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
        payload = verify_token(token)
        if payload is not None:
            return {
                "user": {
                    "id": int(payload["sub"]),
                    "email": payload["email"],
                    "name": payload["name"],
                    "provider": payload.get("provider", "github"),
                },
                "request": request,
            }

    # --- Attempt 2: X-API-Key ---
    if api_key:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.api_key == api_key)
            )
            user = result.scalars().first()
        if user is not None:
            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "provider": user.provider,
                },
                "request": request,
            }

    return {"user": None, "request": request}
