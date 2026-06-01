"""Users CRUD tests for Flask."""

from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

import pytest

from src.auth.jwt import create_access_token
from src.app import app as flask_app

_USER_ID = 42
_TOKEN = create_access_token(user_id=_USER_ID, email="user@example.com", name="Test")
_NOW = datetime.now(timezone.utc)
_AUTH = {"Authorization": f"Bearer {_TOKEN}"}


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as c:
        yield c


def _make_item(item_id=1, title="Test Item", description="desc"):
    item = MagicMock()
    item.id = item_id
    item.title = title
    item.description = description
    item.user_id = _USER_ID
    item.created_at = _NOW
    return item


def test_list_items_returns_200(client):
    items = [_make_item(1, "Item One"), _make_item(2, "Item Two")]
    mock_session = MagicMock()
    mock_q = mock_session.__enter__.return_value.query.return_value
    mock_q.filter.return_value.order_by.return_value.all.return_value = items

    with patch("src.app.get_db", return_value=mock_session):
        r = client.get("/users/me/items", headers=_AUTH)

    assert r.status_code == 200
    body = r.get_json()
    assert isinstance(body["items"], list)
    assert len(body["items"]) == 2


def test_create_item_returns_201(client):
    class FakeItem:
        def __init__(self, title, description, user_id):
            self.id = 10
            self.title = title
            self.description = description
            self.user_id = user_id

    mock_session = MagicMock()
    ms = mock_session.__enter__.return_value
    ms.add = MagicMock()
    ms.flush = MagicMock()

    with patch("src.app.get_db", return_value=mock_session), \
         patch("src.app.Item", FakeItem):
        r = client.post("/users/me/items", json={"title": "New Item"}, headers=_AUTH)

    assert r.status_code == 201
    assert r.get_json()["item"]["title"] == "New Item"


def test_create_item_missing_title_returns_400(client):
    r = client.post("/users/me/items", json={}, headers=_AUTH)
    assert r.status_code == 400


def test_get_item_not_found_returns_404(client):
    mock_session = MagicMock()
    mock_q = mock_session.__enter__.return_value.query.return_value
    mock_q.filter.return_value.first.return_value = None

    with patch("src.app.get_db", return_value=mock_session):
        r = client.get("/users/me/items/999", headers=_AUTH)

    assert r.status_code == 404


def test_list_items_no_auth_returns_401(client):
    r = client.get("/users/me/items")
    assert r.status_code == 401
