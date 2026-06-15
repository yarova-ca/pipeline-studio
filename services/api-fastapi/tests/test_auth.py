"""Tests for auth endpoints and the get_current_user dependency.

Coverage:
  - 401 when no auth credentials are provided
  - 401 when Bearer token has an invalid signature
  - 200 when Bearer JWT is valid
  - 200 when X-API-Key is valid (mocked DB lookup)
  - 401 when X-API-Key is invalid (no matching user)
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.jwt import create_access_token
from src.db.session import get_db
from src.main import app


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_token(user_id: int = 1, email: str = "test@example.com", name: str = "Test User") -> str:
    return create_access_token(user_id=user_id, email=email, name=name)


def _api_client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


# ── Helpers for mocking the DB dependency ─────────────────────────────────────

class _MockUser:
    """Minimal ORM-like object returned from mock DB queries."""

    def __init__(self, user_id: int = 1, email: str = "test@example.com", name: str = "Test User"):
        self.id = user_id
        self.email = email
        self.name = name
        self.provider = "github"
        self.api_key = "valid-api-key-abc123"


class _MockScalars:
    def __init__(self, obj):
        self._obj = obj

    def first(self):
        return self._obj


class _MockResult:
    def __init__(self, obj):
        self._obj = obj

    def scalars(self):
        return _MockScalars(self._obj)


class _MockSessionWithUser:
    """Async session mock that returns a user on any execute()."""

    async def execute(self, *args, **kwargs):
        return _MockResult(_MockUser())

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


class _MockSessionNoUser:
    """Async session mock that returns None (user not found)."""

    async def execute(self, *args, **kwargs):
        return _MockResult(None)

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


# ── Tests: unauthenticated ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_me_no_credentials_returns_401():
    """GET /auth/me with no auth header → 401."""
    async with _api_client() as client:
        r = await client.get("/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_invalid_jwt_returns_401():
    """GET /auth/me with a tampered JWT → 401."""
    async with _api_client() as client:
        r = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401


# ── Tests: valid JWT ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_me_valid_jwt_returns_200():
    """GET /auth/me with a valid JWT → 200 with user payload."""
    token = _make_token()

    async def _mock_db():
        yield _MockSessionNoUser()

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == "test@example.com"
        assert body["name"] == "Test User"
    finally:
        app.dependency_overrides.pop(get_db, None)


# ── Tests: API key ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_me_valid_api_key_returns_200():
    """GET /auth/me with a valid X-API-Key → 200 (DB lookup succeeds)."""

    async def _mock_db():
        yield _MockSessionWithUser()

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.get("/auth/me", headers={"X-API-Key": "valid-api-key-abc123"})
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == "test@example.com"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_auth_me_invalid_api_key_returns_401():
    """GET /auth/me with an unknown API key → 401 (DB finds no user)."""

    async def _mock_db():
        yield _MockSessionNoUser()

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.get("/auth/me", headers={"X-API-Key": "wrong-key"})
        assert r.status_code == 401
    finally:
        app.dependency_overrides.pop(get_db, None)


# ── Tests: dev token ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dev_token_issues_jwt_in_development():
    """POST /dev/token → 200 with a valid JWT (dev environment)."""

    class _MockSessionUpsert:
        """Returns a user from execute() and supports add/flush."""

        async def execute(self, *args, **kwargs):
            return _MockResult(_MockUser())

        async def flush(self):
            pass

        async def commit(self):
            pass

        async def rollback(self):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

    async def _mock_db():
        yield _MockSessionUpsert()

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.post(
                "/dev/token",
                json={"email": "dev@example.com", "name": "Dev User"},
            )
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
    finally:
        app.dependency_overrides.pop(get_db, None)
