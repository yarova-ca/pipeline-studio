"""Auth variant: jwt — Bearer JWT only, no API key fallback."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.jwt import verify_token

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    """Return a dict with user info from a valid JWT Bearer token.

    Returned dict keys: id, email, name, provider.

    When JWT is valid: returns payload without a DB hit.
    When token is missing or invalid: raises HTTP 401.
    """
    if credentials and credentials.credentials:
        payload = verify_token(credentials.credentials)
        if payload is not None:
            return {
                "id": int(payload["sub"]),
                "email": payload["email"],
                "name": payload["name"],
                "provider": payload.get("provider", "github"),
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
