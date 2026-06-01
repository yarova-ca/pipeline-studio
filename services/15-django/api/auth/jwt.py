"""JWT creation and verification — identical to 15-fastapi canonical."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-use-at-least-32-chars")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRY_HOURS: int = 8


def create_access_token(user_id: int, email: str, name: str) -> str:
    """Issue a signed JWT for the given user (8-hour expiry)."""
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT.

    Returns the decoded payload dict when valid.
    Returns None when the token is expired, malformed, or has a bad signature.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
