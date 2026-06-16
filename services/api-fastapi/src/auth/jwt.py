"""JWT creation and verification using python-jose."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from src.compliance import compliance

# Fix 2: Require JWT_SECRET at startup — no insecure fallback allowed.
# Why: a hardcoded fallback secret means any dev token is valid in prod.
_raw_secret = os.getenv("JWT_SECRET")
if not _raw_secret or len(_raw_secret) < 32:
    raise RuntimeError(
        "JWT_SECRET environment variable must be set and be at least 32 characters long"
    )
JWT_SECRET: str = _raw_secret

JWT_ALGORITHM: str = "HS256"
JWT_EXPIRY_HOURS: int = 8


def create_access_token(user_id: int, email: str, name: str) -> str:
    """Issue a signed JWT for the given user.

    Payload fields:
      sub  — user id (str)
      email
      name
      exp  — expiry (8 hours from now, UTC)
      iat  — issued at (UTC)
    """
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "iat": now,
        # Session length is set by the active industry profile (HIPAA → 15 min).
        "exp": now + timedelta(seconds=compliance.session_timeout_seconds),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT.

    Returns the decoded payload dict when valid.
    Returns None when the token is expired, malformed, or has a bad signature.

    Fix 1: algorithms= list is already set to [JWT_ALGORITHM] ("HS256") —
    this prevents algorithm-confusion attacks (e.g. alg:none or RS256 downgrade).
    """
    try:
        # Fix 1: Lock algorithm to HS256 explicitly.
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
