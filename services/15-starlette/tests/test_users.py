"""Users CRUD tests for Starlette."""

from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from typing import Optional

import pytest
from httpx import ASGITransport, AsyncClient

from src.auth.jwt import create_access_token
from src.main import app

_USER_ID = 42
_TOKEN = create_access_token(user_id=_USER_ID, email="user@example.com", name="Test")
_NOW = datetime.now(timezone.utc)


def _make_item(item_id=1, title="Test Item", description="desc"):
    item = MagicMock()
    item.id = item_id
    item.title = title
    item.description = description
    item.user_id = _USER_ID
    item.created_at = _NOW
    return item


class _MockScalars:
    def __init__(self, result):
        self._result = result

    def first(self):
        return self._result if not isinstance(self._result, list) else (self._result[0] if self._result else None)

    def all(self):
        return self._result if isinstance(self._result, list) else ([self._result] if self._result else [])


class _MockResult:
    def __init__(self, result):
        self._result = result

    def scalars(self):
        return _MockScalars(self._result)


def _make_db(execute_result):
    async def _db():
        session = AsyncMock()
        session.execute = AsyncMock(return_value=_MockResult(execute_result))
        session.add = MagicMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()
        session.delete = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        yield session
    return _db


def _api_client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_list_items_returns_200():
    items = [_make_item(1, "Item One"), _make_item(2, "Item Two")]
    async with _api_client() as client:
        with patch("src.main.get_db", _make_db(items)):
            r = await client.get(
                "/users/me/items",
                headers={"Authorization": f"Bearer {_TOKEN}"},
            )
    assert r.status_code == 200
    assert isinstance(r.json()["items"], list)


@pytest.mark.asyncio
async def test_items_no_auth_returns_401():
    async with _api_client() as client:
        with patch("src.main.get_db", _make_db(None)):
            r = await client.get("/users/me/items")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_item_not_found_returns_404():
    async with _api_client() as client:
        with patch("src.main.get_db", _make_db(None)):
            r = await client.get(
                "/users/me/items/999",
                headers={"Authorization": f"Bearer {_TOKEN}"},
            )
    assert r.status_code == 404
