"""WebSocket auth — validates auth on the HTTP upgrade request.

WebSocket clients cannot set custom headers in browser WebSocket API.
Two auth paths are supported:

  1. Authorization: Bearer <JWT> in the upgrade headers (server clients).
  2. ?token=<JWT> query parameter in the WebSocket URL (browser clients).

On valid auth: returns user dict with id, email, name.
On missing or invalid auth: returns None. Caller closes the connection.
"""

from typing import Optional
from urllib.parse import parse_qs, urlparse

from src.auth.jwt import verify_token


def authenticate_upgrade(
    headers: dict[str, str],
    path: str,
) -> Optional[dict]:
    """Extract and verify auth from a WebSocket upgrade request.

    Returns a user dict on success.
    Returns None on auth failure.
    """
    # --- Attempt 1: Authorization header (server-side / Node clients) ---
    auth_header = headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
        payload = verify_token(token)
        if payload is not None:
            return {
                "id": int(payload["sub"]),
                "email": payload["email"],
                "name": payload["name"],
            }

    # --- Attempt 2: ?token= query parameter (browser clients) ---
    parsed = urlparse(path)
    params = parse_qs(parsed.query)
    token_list = params.get("token", [])
    if token_list:
        payload = verify_token(token_list[0])
        if payload is not None:
            return {
                "id": int(payload["sub"]),
                "email": payload["email"],
                "name": payload["name"],
            }

    return None
