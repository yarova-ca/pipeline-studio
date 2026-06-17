"""Yarova platform INVARIANT suite (api-fastapi).

Each test maps to one Yarova platform invariant by I-id and proves the running
app upholds it. This is the definition-of-done bar — it mirrors the NestJS
gold-standard runtime suite.

Invariants covered:
  I-3  — protected route, NO Authorization header        → 401
  I-4  — protected route, garbage/tampered Bearer token   → 401
  I-6  — protected route, valid token + unknown body field → 400
  I-10 — GET /health/live                                  → 200
  I-13 — GET /metrics → 200 and exposes the request-duration golden signal
  I-17 — a response carries x-content-type-options: nosniff

Token minting: tokens are minted with the same create_access_token the app uses
to sign, and verified with the same JWT_SECRET / HS256 the app uses to verify
(src/auth/jwt.py). JWT_SECRET is required at import time, so it is set here
before any app import — a test-only value, not a real secret.
"""

import os

# JWT_SECRET must exist before src.auth.jwt is imported (it raises at import
# time otherwise). Match the CI value used in .github/workflows/05-test.yml.
os.environ.setdefault("JWT_SECRET", "test-secret-at-least-32-characters-long")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

from fastapi.testclient import TestClient  # noqa: E402

from src.auth.jwt import create_access_token  # noqa: E402
from src.db.session import get_db  # noqa: E402
from src.main import app  # noqa: E402

# The REAL protected route used by the auth/JWT invariants.
PROTECTED_GET_ROUTE = "/auth/me"
# The REAL protected route that accepts a JSON body (for the I-6 unknown-field check).
PROTECTED_POST_ROUTE = "/users/me/items"
# The REAL golden-signal metric name exposed at /metrics (src/main.py HTTP_DURATION).
GOLDEN_SIGNAL_METRIC = "http_request_duration_seconds"


# ── DB dependency override ──────────────────────────────────────────────────────
# I-6 needs a VALID token to pass auth so the request reaches body validation.
# get_current_user returns from the JWT payload without a DB hit, but get_db is
# still resolved as a dependency, so it must yield a usable session stub.

class _StubScalars:
    def first(self):
        return None

    def all(self):
        return []


class _StubResult:
    def scalars(self):
        return _StubScalars()


class _StubSession:
    async def execute(self, *args, **kwargs):
        return _StubResult()

    def add(self, *args, **kwargs):
        # sync in SQLAlchemy AsyncSession
        pass

    async def refresh(self, obj, *args, **kwargs):
        # populate the server-default columns the response_model needs.
        if getattr(obj, "id", None) is None:
            obj.id = 1

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def rollback(self):
        pass


async def _stub_db():
    yield _StubSession()


def _valid_token() -> str:
    """Mint a token the app will accept — same signer the app uses to verify."""
    return create_access_token(user_id=1, email="test@example.com", name="Test User")


client = TestClient(app)


# ── I-3 ─────────────────────────────────────────────────────────────────────────

def test_I3_protected_route_without_auth_header_returns_401():
    """I-3: GET a protected route with NO Authorization header → 401."""
    r = client.get(PROTECTED_GET_ROUTE)
    assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"


# ── I-4 ─────────────────────────────────────────────────────────────────────────

def test_I4_protected_route_with_tampered_bearer_returns_401():
    """I-4: GET a protected route with a garbage/tampered Bearer token → 401."""
    r = client.get(
        PROTECTED_GET_ROUTE,
        headers={"Authorization": "Bearer not.a.real.tampered.token"},
    )
    assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"


# ── I-6 ─────────────────────────────────────────────────────────────────────────

def test_I6_valid_token_with_unknown_body_field_returns_400():
    """I-6: POST a protected route with a VALID token + unknown extra body field → 400.

    A valid token clears auth; the unknown field must be rejected by the model
    (extra="forbid") and surfaced as 400, not silently ignored.
    """
    app.dependency_overrides[get_db] = _stub_db
    try:
        r = client.post(
            PROTECTED_POST_ROUTE,
            headers={"Authorization": f"Bearer {_valid_token()}"},
            json={"title": "valid title", "is_admin": True},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)
    assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"


def test_I6_valid_token_with_known_fields_is_accepted():
    """I-6 (control): same route + valid token + ONLY known fields is NOT 400.

    Proves the 400 above is caused by the unknown field, not by auth or the
    route itself rejecting all bodies.
    """
    app.dependency_overrides[get_db] = _stub_db
    try:
        r = client.post(
            PROTECTED_POST_ROUTE,
            headers={"Authorization": f"Bearer {_valid_token()}"},
            json={"title": "valid title", "description": "ok"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)
    assert r.status_code != 400, f"known-field body wrongly rejected: {r.status_code} {r.text}"
    assert r.status_code != 401, f"valid token wrongly rejected: {r.status_code} {r.text}"


# ── I-10 ────────────────────────────────────────────────────────────────────────

def test_I10_health_live_returns_200():
    """I-10: GET /health/live → 200."""
    r = client.get("/health/live")
    assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"


# ── I-13 ────────────────────────────────────────────────────────────────────────

def test_I13_metrics_endpoint_exposes_request_duration_golden_signal():
    """I-13: GET /metrics → 200 and body contains the request-duration golden signal."""
    r = client.get("/metrics")
    assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
    assert GOLDEN_SIGNAL_METRIC in r.text, (
        f"golden-signal metric '{GOLDEN_SIGNAL_METRIC}' not found in /metrics body"
    )


# ── I-17 ────────────────────────────────────────────────────────────────────────

def test_I17_response_carries_nosniff_security_header():
    """I-17: a response carries security header x-content-type-options: nosniff."""
    r = client.get("/health/live")
    assert r.headers.get("x-content-type-options") == "nosniff", (
        f"missing/incorrect nosniff header: {r.headers.get('x-content-type-options')!r}"
    )
