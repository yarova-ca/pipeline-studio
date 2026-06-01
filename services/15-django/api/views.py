"""Django API views — auth + users CRUD.

Routes (wired in config/urls.py):
  GET  /auth/me           — current user (requires auth)
  POST /auth/logout       — clear session cookie
  POST /auth/api-key      — generate api_key (requires auth)
  DELETE /auth/api-key    — revoke api_key (requires auth)
  POST /dev/token         — dev-only: issue JWT without OAuth
  GET  /users/me/items    — list items (requires auth)
  POST /users/me/items    — create item (requires auth)
  GET  /users/me/items/<id>  — get item (requires auth)
  PUT  /users/me/items/<id>  — update item (requires auth)
  DELETE /users/me/items/<id> — delete item (requires auth)
"""

import json
import os
import secrets

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from api.auth.decorators import require_auth
from api.auth.jwt import create_access_token, verify_token
from api.db.models import User, Item
from api.db.session import get_db

_IS_DEV = os.getenv("NODE_ENV", "development") == "development"


# ── Auth views ────────────────────────────────────────────────────────────────

@require_http_methods(["GET"])
@require_auth
def auth_me(request: HttpRequest):
    """Return the authenticated user's profile."""
    return JsonResponse({"user": request.user_data})


@csrf_exempt
@require_http_methods(["POST"])
def auth_logout(request: HttpRequest):
    """Clear session cookie."""
    response = JsonResponse({"message": "Logged out"})
    response.delete_cookie("access_token")
    return response


@csrf_exempt
@require_http_methods(["POST", "DELETE"])
@require_auth
def auth_api_key(request: HttpRequest):
    """POST → generate new API key. DELETE → revoke API key."""
    user_id = request.user_data["id"]

    if request.method == "POST":
        new_key = secrets.token_urlsafe(48)
        with get_db() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return JsonResponse({"error": "User not found"}, status=404)
            user.api_key = new_key
        return JsonResponse({"api_key": new_key})

    # DELETE
    with get_db() as session:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return JsonResponse({"error": "User not found"}, status=404)
        user.api_key = None
    return JsonResponse({"message": "API key revoked"}, status=204)


@csrf_exempt
@require_http_methods(["POST"])
def dev_token(request: HttpRequest):
    """Dev-only: issue JWT without OAuth. Returns 403 in non-dev environments."""
    if not _IS_DEV:
        return JsonResponse({"error": "Dev token endpoint is disabled in production"}, status=403)
    body = json.loads(request.body or b"{}")
    email = body.get("email", "dev@example.com")
    name = body.get("name", "Dev User")
    with get_db() as session:
        user = session.query(User).filter(User.email == email).first()
        if user is None:
            user = User(email=email, name=name, provider="dev")
            session.add(user)
            session.flush()
        else:
            user.name = name
            user.provider = "dev"
        token = create_access_token(user_id=user.id, email=user.email, name=user.name)
    return JsonResponse({"access_token": token, "token_type": "bearer"})


# ── Users / Items views ───────────────────────────────────────────────────────

@csrf_exempt
@require_auth
def users_items(request: HttpRequest):
    """GET → list items. POST → create item."""
    user_id = request.user_data["id"]

    if request.method == "GET":
        with get_db() as session:
            items = (
                session.query(Item)
                .filter(Item.user_id == user_id)
                .order_by(Item.created_at.desc())
                .all()
            )
            return JsonResponse({
                "items": [
                    {"id": i.id, "title": i.title, "description": i.description, "user_id": i.user_id}
                    for i in items
                ]
            })

    if request.method == "POST":
        body = json.loads(request.body or b"{}")
        title = body.get("title")
        if not title:
            return JsonResponse({"error": "title is required"}, status=400)
        description = body.get("description")
        with get_db() as session:
            item = Item(title=title, description=description, user_id=user_id)
            session.add(item)
            session.flush()
            return JsonResponse(
                {"item": {"id": item.id, "title": item.title, "description": item.description, "user_id": item.user_id}},
                status=201,
            )

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@require_auth
def users_item_detail(request: HttpRequest, item_id: int):
    """GET → get item. PUT → update item. DELETE → delete item."""
    user_id = request.user_data["id"]

    if request.method == "GET":
        with get_db() as session:
            item = session.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
            if not item:
                return JsonResponse({"error": "Item not found"}, status=404)
            return JsonResponse({"item": {"id": item.id, "title": item.title, "description": item.description, "user_id": item.user_id}})

    if request.method == "PUT":
        body = json.loads(request.body or b"{}")
        with get_db() as session:
            item = session.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
            if not item:
                return JsonResponse({"error": "Item not found"}, status=404)
            if body.get("title"):
                item.title = body["title"]
            if "description" in body:
                item.description = body["description"]
            return JsonResponse({"item": {"id": item.id, "title": item.title, "description": item.description, "user_id": item.user_id}})

    if request.method == "DELETE":
        with get_db() as session:
            item = session.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
            if not item:
                return JsonResponse({"error": "Item not found"}, status=404)
            session.delete(item)
        from django.http import HttpResponse
        return HttpResponse(status=204)

    return JsonResponse({"error": "Method not allowed"}, status=405)
