"""Flask auth decorator — get_current_user pattern.

Resolution order:
1. Bearer JWT in Authorization header.
2. X-API-Key header (sync DB lookup).

When both are missing or invalid: returns JSON 401.
"""

import functools
from typing import Optional

from flask import request, jsonify, g

from src.auth.jwt import verify_token
from src.db.models import User
from src.db.session import get_db


def _resolve_user() -> Optional[dict]:
    """Extract user from JWT or API key. Returns dict or None."""
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
        with get_db() as session:
            user: Optional[User] = session.query(User).filter(User.api_key == api_key).first()
            if user is not None:
                return {"id": user.id, "email": user.email, "name": user.name, "provider": user.provider}

    return None


def require_auth(f):
    """Decorator that sets g.current_user or returns 401."""

    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user = _resolve_user()
        if user is None:
            return jsonify({"error": "Authentication required. Provide Bearer token or X-API-Key header."}), 401
        g.current_user = user
        return f(*args, **kwargs)

    return wrapper
