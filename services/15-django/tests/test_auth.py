"""Auth tests for Django.

Tests GET /auth/me with no auth, invalid JWT, valid JWT, valid API key, invalid API key.
Uses Django test client with mocked SQLAlchemy session.
"""

from unittest.mock import MagicMock, patch

import pytest
from django.test import Client

from api.auth.jwt import create_access_token


@pytest.fixture
def client():
    return Client()


def _make_token(user_id=1, email="test@example.com", name="Test User"):
    return create_access_token(user_id=user_id, email=email, name=name)


class MockUser:
    id = 1
    email = "test@example.com"
    name = "Test User"
    provider = "github"
    api_key = "valid-api-key-abc123"


# ── Tests: unauthenticated ─────────────────────────────────────────────────────

@pytest.mark.django_db(databases=[])
def test_auth_me_no_credentials_returns_401(client):
    """GET /auth/me with no auth → 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401


@pytest.mark.django_db(databases=[])
def test_auth_me_invalid_jwt_returns_401(client):
    """GET /auth/me with tampered JWT → 401."""
    response = client.get("/auth/me", HTTP_AUTHORIZATION="Bearer not.a.real.token")
    assert response.status_code == 401


# ── Tests: valid JWT ───────────────────────────────────────────────────────────

@pytest.mark.django_db(databases=[])
def test_auth_me_valid_jwt_returns_200(client):
    """GET /auth/me with valid JWT → 200."""
    token = _make_token()
    response = client.get("/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "test@example.com"


# ── Tests: API key ─────────────────────────────────────────────────────────────

@pytest.mark.django_db(databases=[])
def test_auth_me_valid_api_key_returns_200(client):
    """GET /auth/me with valid X-API-Key → 200 (mocked DB lookup)."""
    mock_session = MagicMock()
    mock_query = mock_session.__enter__.return_value.query.return_value
    mock_query.filter.return_value.first.return_value = MockUser()

    with patch("api.auth.decorators.get_db", return_value=mock_session):
        response = client.get("/auth/me", HTTP_X_API_KEY="valid-api-key-abc123")

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "test@example.com"


@pytest.mark.django_db(databases=[])
def test_auth_me_invalid_api_key_returns_401(client):
    """GET /auth/me with unknown API key → 401."""
    mock_session = MagicMock()
    mock_query = mock_session.__enter__.return_value.query.return_value
    mock_query.filter.return_value.first.return_value = None

    with patch("api.auth.decorators.get_db", return_value=mock_session):
        response = client.get("/auth/me", HTTP_X_API_KEY="wrong-key")

    assert response.status_code == 401
