"""Auth tests for Starlette.

Uses httpx.AsyncClient with ASGITransport to test the app directly.
DB session is mocked via module-level patch.
"""

from unittest.mock import MagicMock, AsyncMock, patch
from typing import Optional

import pytest
from httpx import ASGITransport, AsyncClient

from src.auth.jwt import create_access_token
from src.main import app


def _make_token(user_id=1, email="test@example.com", name="Test User"):
    return create_access_token(user_id=user_id, email=email, name=name)


class _MockUser:
    id = 1
    email = "test@example.com"
    name = "Test User"
    provider = "github"
    api_key = "valid-api-key-abc123"


def _api_client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


# ── Helpers for mocking the DB ─────────────────────────────────────────────────

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


async def _db_with_user():
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_MockResult(_MockUser()))
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    yield session


async def _db_no_user():
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_MockResult(None))
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    yield session


# ── Tests ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_me_no_credentials_returns_401():
    async with _api_client() as client:
        with patch("src.main.get_db", _db_no_user):
            r = await client.get("/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_invalid_jwt_returns_401():
    async with _api_client() as client:
        with patch("src.main.get_db", _db_no_user):
            r = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_valid_jwt_returns_200():
    token = _make_token()
    async with _api_client() as client:
        with patch("src.main.get_db", _db_no_user):
            r = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["user"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_auth_me_valid_api_key_returns_200():
    async with _api_client() as client:
        with patch("src.main.get_db", _db_with_user):
            r = await client.get("/auth/me", headers={"X-API-Key": "valid-api-key-abc123"})
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_auth_me_invalid_api_key_returns_401():
    async with _api_client() as client:
        with patch("src.main.get_db", _db_no_user):
            r = await client.get("/auth/me", headers={"X-API-Key": "wrong-key"})
    assert r.status_code == 401
