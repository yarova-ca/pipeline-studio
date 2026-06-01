"""Django auth decorator — get_current_user pattern adapted from FastAPI dependency.

Resolution order:
1. Bearer JWT in Authorization header.
2. X-API-Key header (sync DB lookup).

When both are missing or invalid: returns JsonResponse(401).
"""

import functools
from typing import Optional

from django.http import HttpRequest, JsonResponse

from api.auth.jwt import verify_token
from api.db.models import User
from api.db.session import get_db


def _resolve_user(request: HttpRequest) -> Optional[dict]:
    """Extract user from JWT or API key. Returns dict or None."""
    auth_header = request.headers.get("Authorization", "")
    api_key = request.headers.get("X-API-Key", "")

    # --- Try Bearer JWT first ---
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

    # --- Try X-API-Key ---
    if api_key:
        with get_db() as session:
            user: Optional[User] = (
                session.query(User).filter(User.api_key == api_key).first()
            )
            if user is not None:
                return {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "provider": user.provider,
                }

    return None


def require_auth(view_func):
    """Decorator that attaches request.user_data or returns 401."""

    @functools.wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        user = _resolve_user(request)
        if user is None:
            return JsonResponse(
                {"error": "Authentication required. Provide Bearer token or X-API-Key header."},
                status=401,
            )
        request.user_data = user
        return view_func(request, *args, **kwargs)

    return wrapper
