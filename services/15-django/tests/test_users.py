"""Users CRUD tests for Django.

Uses Django test client with valid JWT for auth and mocked SQLAlchemy session.
"""

from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

import pytest
from django.test import Client

from api.auth.jwt import create_access_token

_USER_ID = 42
_TOKEN = create_access_token(user_id=_USER_ID, email="user@example.com", name="Test")
_NOW = datetime.now(timezone.utc)


@pytest.fixture
def client():
    return Client()


def _make_item(item_id=1, title="Test Item", description="desc"):
    item = MagicMock()
    item.id = item_id
    item.title = title
    item.description = description
    item.user_id = _USER_ID
    item.created_at = _NOW
    item.updated_at = _NOW
    return item


@pytest.mark.django_db(databases=[])
def test_list_items_returns_200(client):
    """GET /users/me/items → 200 with list."""
    items = [_make_item(1, "Item One"), _make_item(2, "Item Two")]

    mock_session = MagicMock()
    mock_q = mock_session.__enter__.return_value.query.return_value
    mock_q.filter.return_value.order_by.return_value.all.return_value = items

    with patch("api.views.get_db", return_value=mock_session):
        response = client.get("/users/me/items", HTTP_AUTHORIZATION=f"Bearer {_TOKEN}")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["items"], list)
    assert len(body["items"]) == 2


@pytest.mark.django_db(databases=[])
def test_create_item_returns_201(client):
    """POST /users/me/items → 201."""
    new_item = _make_item(item_id=10, title="New Item")

    mock_session = MagicMock()
    ms = mock_session.__enter__.return_value
    ms.add = MagicMock()
    ms.flush = MagicMock()

    import api.views as views_module
    original_item_class = views_module.Item

    class FakeItem:
        def __init__(self, title, description, user_id):
            self.id = 10
            self.title = title
            self.description = description
            self.user_id = user_id

    with patch("api.views.get_db", return_value=mock_session), \
         patch("api.views.Item", FakeItem):
        response = client.post(
            "/users/me/items",
            data='{"title": "New Item"}',
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {_TOKEN}",
        )

    assert response.status_code == 201
    body = response.json()
    assert body["item"]["title"] == "New Item"


@pytest.mark.django_db(databases=[])
def test_list_items_no_auth_returns_401(client):
    """GET /users/me/items without auth → 401."""
    response = client.get("/users/me/items")
    assert response.status_code == 401
