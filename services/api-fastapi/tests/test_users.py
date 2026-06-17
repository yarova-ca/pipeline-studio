"""Tests for the /users/me/items CRUD endpoints.

All requests use a valid JWT.
DB session is mocked via dependency_overrides.

Coverage:
  - GET  /users/me/items        — returns list of items
  - POST /users/me/items        — creates an item, returns 201
  - GET  /users/me/items/{id}   — returns one item
  - PUT  /users/me/items/{id}   — updates an item
  - DELETE /users/me/items/{id} — deletes an item, returns 204
"""

from datetime import datetime, timezone
from typing import Optional
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.auth.jwt import create_access_token
from src.db.session import get_db
from src.main import app

# ── Helpers ───────────────────────────────────────────────────────────────────

_USER_ID = 42
_TOKEN = create_access_token(user_id=_USER_ID, email="user@example.com", name="Test")

_NOW = datetime.now(timezone.utc)


def _make_item(item_id: int = 1, title: str = "Test Item", description: Optional[str] = "desc") -> MagicMock:
    """Create a mock Item ORM object."""
    item = MagicMock()
    item.id = item_id
    item.title = title
    item.description = description
    item.user_id = _USER_ID
    item.created_at = _NOW
    item.updated_at = _NOW
    return item


def _api_client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


class _MockScalars:
    def __init__(self, result):
        self._result = result

    def first(self):
        return self._result if not isinstance(self._result, list) else (self._result[0] if self._result else None)

    def all(self):
        return self._result if isinstance(self._result, list) else [self._result] if self._result else []


class _MockExecuteResult:
    def __init__(self, result, count=0):
        self._result = result
        self._count = count

    def scalars(self):
        return _MockScalars(self._result)

    def scalar_one(self):
        # Used by the paginated list route's COUNT(*) query.
        return self._count


def _make_db_session(execute_result, item_to_add: Optional[MagicMock] = None) -> object:
    """Build an async session mock returning execute_result from execute().

    The paginated list route runs two queries per request:
      1. the items page (returns execute_result via scalars().all())
      2. a COUNT(*) total (returns the row count via scalar_one())
    The mock serves the items result first, then a count result.
    """

    _list_total = len(execute_result) if isinstance(execute_result, list) else 0

    class _Session:
        def __init__(self):
            self._execute_calls = 0

        async def execute(self, *args, **kwargs):
            self._execute_calls += 1
            # Second execute() in list_items is the COUNT(*) query.
            if self._execute_calls >= 2:
                return _MockExecuteResult(None, count=_list_total)
            return _MockExecuteResult(execute_result, count=_list_total)

        def add(self, obj):
            # Simulate DB assigning an id.
            if item_to_add is not None:
                obj.id = item_to_add.id
                obj.user_id = _USER_ID

        async def flush(self):
            pass

        async def refresh(self, obj):
            # Populate fields from item_to_add after flush.
            if item_to_add is not None:
                obj.id = item_to_add.id
                obj.title = item_to_add.title
                obj.description = item_to_add.description
                obj.user_id = item_to_add.user_id

        async def delete(self, obj):
            pass

        async def commit(self):
            pass

        async def rollback(self):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

    return _Session()


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_items_returns_200():
    """GET /users/me/items → 200 with a paginated page of items."""
    items = [_make_item(1, "Item One"), _make_item(2, "Item Two")]

    async def _mock_db():
        yield _make_db_session(items)

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.get(
                "/users/me/items",
                headers={"Authorization": f"Bearer {_TOKEN}"},
            )
        assert r.status_code == 200
        body = r.json()
        # Route returns a PaginatedItemsResponse, not a bare list.
        assert isinstance(body["items"], list)
        assert len(body["items"]) == 2
        assert body["items"][0]["title"] == "Item One"
        assert body["total"] == 2
        assert body["limit"] == 20
        assert body["offset"] == 0
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_create_item_returns_201():
    """POST /users/me/items → 201 with created item."""
    new_item = _make_item(item_id=10, title="New Item", description="A new one")

    async def _mock_db():
        yield _make_db_session(execute_result=None, item_to_add=new_item)

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.post(
                "/users/me/items",
                headers={"Authorization": f"Bearer {_TOKEN}"},
                json={"title": "New Item", "description": "A new one"},
            )
        assert r.status_code == 201
        body = r.json()
        assert body["title"] == "New Item"
        assert body["description"] == "A new one"
        assert body["user_id"] == _USER_ID
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_get_item_returns_200():
    """GET /users/me/items/{id} → 200 with the item."""
    item = _make_item(item_id=5, title="Fetched Item")

    async def _mock_db():
        yield _make_db_session(item)

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.get(
                "/users/me/items/5",
                headers={"Authorization": f"Bearer {_TOKEN}"},
            )
        assert r.status_code == 200
        assert r.json()["id"] == 5
        assert r.json()["title"] == "Fetched Item"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_get_item_not_found_returns_404():
    """GET /users/me/items/{id} when item does not exist → 404."""

    async def _mock_db():
        yield _make_db_session(None)

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.get(
                "/users/me/items/999",
                headers={"Authorization": f"Bearer {_TOKEN}"},
            )
        assert r.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_update_item_returns_200():
    """PUT /users/me/items/{id} → 200 with updated item."""
    item = _make_item(item_id=3, title="Old Title")

    async def _mock_db():
        yield _make_db_session(item)

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.put(
                "/users/me/items/3",
                headers={"Authorization": f"Bearer {_TOKEN}"},
                json={"title": "New Title"},
            )
        assert r.status_code == 200
        # Item title is mutated in place by the route handler.
        assert r.json()["title"] == "New Title"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_delete_item_returns_204():
    """DELETE /users/me/items/{id} → 204 no content."""
    item = _make_item(item_id=7, title="To Delete")

    async def _mock_db():
        yield _make_db_session(item)

    app.dependency_overrides[get_db] = _mock_db
    try:
        async with _api_client() as client:
            r = await client.delete(
                "/users/me/items/7",
                headers={"Authorization": f"Bearer {_TOKEN}"},
            )
        assert r.status_code == 204
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_items_route_requires_auth():
    """GET /users/me/items with no auth → 401."""
    async with _api_client() as client:
        r = await client.get("/users/me/items")
    assert r.status_code == 401
