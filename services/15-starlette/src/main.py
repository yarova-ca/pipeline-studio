import json
import os
import secrets

from dotenv import load_dotenv
from sqlalchemy import select
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

load_dotenv()

from src.auth.jwt import create_access_token, verify_token
from src.auth.dependencies import get_current_user, UNAUTHORIZED
from src.db.models import User, Item
from src.db.session import get_db

_IS_DEV = os.getenv("NODE_ENV", "development") == "development"


# ── Core routes ────────────────────────────────────────────────────────────────

def hello(request: Request):
    return JSONResponse({"message": "Hello from Starlette 0.41", "framework": "15-starlette", "version": "1.0.0"})

def health(request: Request):
    return JSONResponse({"status": "ok", "version": "1.0.0"})

def liveness(request: Request):
    return JSONResponse({"status": "ok"})

def readiness(request: Request):
    return JSONResponse({"status": "ok"})


# ── Auth routes ────────────────────────────────────────────────────────────────

async def auth_me(request: Request):
    async for db in get_db():
        user = await get_current_user(request, db)
        if user is None:
            return UNAUTHORIZED
        return JSONResponse({"user": user})


async def auth_logout(request: Request):
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie("access_token")
    return response


async def auth_api_key(request: Request):
    async for db in get_db():
        user = await get_current_user(request, db)
        if user is None:
            return UNAUTHORIZED

        if request.method == "POST":
            new_key = secrets.token_urlsafe(48)
            result = await db.execute(select(User).where(User.id == user["id"]))
            db_user = result.scalars().first()
            if not db_user:
                return JSONResponse({"error": "User not found"}, status_code=404)
            db_user.api_key = new_key
            await db.flush()
            return JSONResponse({"api_key": new_key})

        # DELETE
        result = await db.execute(select(User).where(User.id == user["id"]))
        db_user = result.scalars().first()
        if not db_user:
            return JSONResponse({"error": "User not found"}, status_code=404)
        db_user.api_key = None
        await db.flush()
        return JSONResponse({"message": "API key revoked"})


async def dev_token(request: Request):
    if not _IS_DEV:
        return JSONResponse({"error": "Dev token endpoint is disabled in production"}, status_code=403)
    body = await request.json()
    email = body.get("email", "dev@example.com")
    name = body.get("name", "Dev User")
    async for db in get_db():
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user is None:
            user = User(email=email, name=name, provider="dev")
            db.add(user)
            await db.flush()
        else:
            user.name = name
        token = create_access_token(user_id=user.id, email=user.email, name=user.name)
        return JSONResponse({"access_token": token, "token_type": "bearer"})


# ── Users / Items routes ───────────────────────────────────────────────────────

async def users_items(request: Request):
    async for db in get_db():
        user = await get_current_user(request, db)
        if user is None:
            return UNAUTHORIZED
        user_id = user["id"]

        if request.method == "GET":
            result = await db.execute(select(Item).where(Item.user_id == user_id).order_by(Item.created_at.desc()))
            items = result.scalars().all()
            return JSONResponse({"items": [
                {"id": i.id, "title": i.title, "description": i.description, "user_id": i.user_id}
                for i in items
            ]})

        body = await request.json()
        title = body.get("title")
        if not title:
            return JSONResponse({"error": "title is required"}, status_code=400)
        item = Item(title=title, description=body.get("description"), user_id=user_id)
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return JSONResponse(
            {"item": {"id": item.id, "title": item.title, "description": item.description, "user_id": item.user_id}},
            status_code=201,
        )


async def users_item_detail(request: Request):
    item_id = int(request.path_params["item_id"])
    async for db in get_db():
        user = await get_current_user(request, db)
        if user is None:
            return UNAUTHORIZED
        user_id = user["id"]

        result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == user_id))
        item = result.scalars().first()

        if request.method == "GET":
            if not item:
                return JSONResponse({"error": "Item not found"}, status_code=404)
            return JSONResponse({"item": {"id": item.id, "title": item.title, "description": item.description, "user_id": item.user_id}})

        if request.method == "PUT":
            if not item:
                return JSONResponse({"error": "Item not found"}, status_code=404)
            body = await request.json()
            if body.get("title"):
                item.title = body["title"]
            if "description" in body:
                item.description = body["description"]
            await db.flush()
            return JSONResponse({"item": {"id": item.id, "title": item.title, "description": item.description, "user_id": item.user_id}})

        if request.method == "DELETE":
            if not item:
                return JSONResponse({"error": "Item not found"}, status_code=404)
            await db.delete(item)
            await db.flush()
            return Response(status_code=204)

        return JSONResponse({"error": "Method not allowed"}, status_code=405)


app = Starlette(routes=[
    Route('/', hello),
    Route('/health', health),
    Route('/health/live', liveness),
    Route('/health/ready', readiness),
    # ── Auth ───────────────────────────────────────────────────────────────
    Route('/auth/me', auth_me, methods=["GET"]),
    Route('/auth/logout', auth_logout, methods=["POST"]),
    Route('/auth/api-key', auth_api_key, methods=["POST", "DELETE"]),
    Route('/dev/token', dev_token, methods=["POST"]),
    # ── Users ──────────────────────────────────────────────────────────────
    Route('/users/me/items', users_items, methods=["GET", "POST"]),
    Route('/users/me/items/{item_id:int}', users_item_detail, methods=["GET", "PUT", "DELETE"]),
])

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '8080')))
