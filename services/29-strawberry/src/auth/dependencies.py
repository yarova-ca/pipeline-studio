"""FastAPI auth dependency: get_current_user.

Resolution order:
1. Bearer JWT in Authorization header.
2. X-API-Key header (DB lookup).

When both are missing or invalid: raises HTTP 401.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.jwt import verify_token
from src.db.models import User
from src.db.session import get_db

_bearer = HTTPBearer(auto_error=False)
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    api_key: Optional[str] = Depends(_api_key_header),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return a dict with user info from a valid JWT or API key.

    Returned dict keys: id, email, name, provider.

    When JWT is valid: returns payload without a DB hit.
    When API key is valid: returns user row from DB.
    When both are missing or invalid: raises HTTP 401.
    """
    # --- Try Bearer JWT first ---
    if credentials and credentials.credentials:
        payload = verify_token(credentials.credentials)
        if payload is not None:
            return {
                "id": int(payload["sub"]),
                "email": payload["email"],
                "name": payload["name"],
                "provider": payload.get("provider", "github"),
            }

    # --- Try X-API-Key ---
    if api_key:
        result = await db.execute(select(User).where(User.api_key == api_key))
        user: Optional[User] = result.scalars().first()
        if user is not None:
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "provider": user.provider,
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
