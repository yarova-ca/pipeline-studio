"""Auth tests for Flask.

Tests GET /auth/me with no auth, invalid JWT, valid JWT, valid API key, invalid API key.
"""

from unittest.mock import MagicMock, patch

import pytest

from src.auth.jwt import create_access_token
from src.app import app as flask_app


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as c:
        yield c


def _make_token(user_id=1, email="test@example.com", name="Test User"):
    return create_access_token(user_id=user_id, email=email, name=name)


class MockUser:
    id = 1
    email = "test@example.com"
    name = "Test User"
    provider = "github"
    api_key = "valid-api-key-abc123"


def test_auth_me_no_credentials_returns_401(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_auth_me_invalid_jwt_returns_401(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401


def test_auth_me_valid_jwt_returns_200(client):
    token = _make_token()
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.get_json()["user"]["email"] == "test@example.com"


def test_auth_me_valid_api_key_returns_200(client):
    mock_session = MagicMock()
    mock_q = mock_session.__enter__.return_value.query.return_value
    mock_q.filter.return_value.first.return_value = MockUser()

    with patch("src.auth.decorators.get_db", return_value=mock_session):
        r = client.get("/auth/me", headers={"X-API-Key": "valid-api-key-abc123"})

    assert r.status_code == 200
    assert r.get_json()["user"]["email"] == "test@example.com"


def test_auth_me_invalid_api_key_returns_401(client):
    mock_session = MagicMock()
    mock_q = mock_session.__enter__.return_value.query.return_value
    mock_q.filter.return_value.first.return_value = None

    with patch("src.auth.decorators.get_db", return_value=mock_session):
        r = client.get("/auth/me", headers={"X-API-Key": "wrong-key"})

    assert r.status_code == 401
