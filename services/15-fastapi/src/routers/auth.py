"""Auth router.

Routes:
  GET  /auth/login        — redirect to GitHub OAuth
  GET  /auth/callback     — exchange code, upsert user, return JWT
  GET  /auth/me           — current user (requires auth)
  POST /auth/logout       — clear session cookie
  POST /auth/api-key      — generate api_key (requires auth)
  DELETE /auth/api-key    — revoke api_key (requires auth)
  POST /dev/token         — dev-only: issue JWT without OAuth
"""

import os
import secrets
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.active import get_current_user
from src.auth.jwt import create_access_token
from src.db.models import User
from src.db.active import get_db

router = APIRouter()

# --- GitHub OAuth constants ---
_GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
_GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
_GITHUB_USER_URL = "https://api.github.com/user"

_CLIENT_ID: str = os.getenv("AUTH_CLIENT_ID", "")
_CLIENT_SECRET: str = os.getenv("AUTH_CLIENT_SECRET", "")
_CALLBACK_URL: str = os.getenv("AUTH_CALLBACK_URL", "http://localhost:8080/auth/callback")
_IS_DEV: bool = os.getenv("NODE_ENV", "development") == "development"


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    provider: str

    model_config = {"from_attributes": True}


class DevTokenRequest(BaseModel):
    email: str
    name: str


class ApiKeyResponse(BaseModel):
    api_key: str


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _upsert_user(db: AsyncSession, email: str, name: str, provider: str = "github") -> User:
    """Insert or update a user row and return the User ORM object."""
    result = await db.execute(select(User).where(User.email == email))
    user: Optional[User] = result.scalars().first()
    if user is None:
        user = User(email=email, name=name, provider=provider)
        db.add(user)
        await db.flush()
    else:
        user.name = name
        user.provider = provider
    return user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/auth/login")
async def login() -> RedirectResponse:
    """Redirect browser to GitHub OAuth consent screen."""
    if not _CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTH_CLIENT_ID is not configured",
        )
    state = secrets.token_urlsafe(32)
    github_auth_url = (
        f"{_GITHUB_AUTHORIZE_URL}"
        f"?client_id={_CLIENT_ID}"
        f"&redirect_uri={_CALLBACK_URL}"
        f"&scope=read:user%20user:email"
    )
    response = RedirectResponse(url=github_auth_url + "&state=" + state)
    response.set_cookie("oauth_state", state, httponly=True, samesite="lax", max_age=600)
    return response


@router.get("/auth/callback", response_model=TokenResponse)
async def callback(
    request: Request,
    response: Response,
    code: str,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange OAuth code for a GitHub token, upsert user, return JWT."""
    if not _CLIENT_ID or not _CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth is not configured",
        )

    # CSRF protection — validate OAuth state against the cookie.
    cookie_state = request.cookies.get("oauth_state")
    if not cookie_state or cookie_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    async with httpx.AsyncClient() as client:
        # Exchange code for access token.
        token_resp = await client.post(
            _GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": _CLIENT_ID,
                "client_secret": _CLIENT_SECRET,
                "code": code,
                "redirect_uri": _CALLBACK_URL,
            },
        )
        token_data = token_resp.json()
        github_token: Optional[str] = token_data.get("access_token")
        if not github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to obtain GitHub access token",
            )

        # Fetch GitHub user profile.
        user_resp = await client.get(
            _GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {github_token}", "Accept": "application/json"},
        )
        github_user = user_resp.json()

    email: Optional[str] = github_user.get("email")
    name: str = github_user.get("name") or github_user.get("login", "Unknown")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account has no public email address",
        )

    user = await _upsert_user(db, email=email, name=name, provider="github")
    token = create_access_token(user_id=user.id, email=user.email, name=user.name)
    response.delete_cookie("oauth_state")
    return TokenResponse(access_token=token)


@router.get("/auth/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse(**current_user)


@router.post("/auth/logout")
async def logout(response: Response) -> dict:
    """Clear the session cookie (for cookie-based flows)."""
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.post("/auth/api-key", response_model=ApiKeyResponse)
async def generate_api_key(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyResponse:
    """Generate a new API key for the authenticated user.

    Replaces any existing key — only one active key per user.
    """
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    user: Optional[User] = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_key = secrets.token_urlsafe(48)
    user.api_key = new_key
    await db.flush()
    return ApiKeyResponse(api_key=new_key)


@router.delete("/auth/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke the current user's API key."""
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    user: Optional[User] = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.api_key = None
    await db.flush()


@router.post("/dev/token", response_model=TokenResponse)
async def dev_token(
    payload: DevTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Dev-only: issue a JWT without OAuth.

    Upserts a user with provider="dev".
    Returns HTTP 403 when NODE_ENV is not "development".
    """
    if not _IS_DEV:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev token endpoint is disabled in production",
        )
    user = await _upsert_user(db, email=payload.email, name=payload.name, provider="dev")
    token = create_access_token(user_id=user.id, email=user.email, name=user.name)
    return TokenResponse(access_token=token)
