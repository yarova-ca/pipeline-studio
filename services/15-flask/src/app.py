import os
import secrets

from flask import Flask, jsonify, g, request
from dotenv import load_dotenv

load_dotenv()

from src.auth.jwt import create_access_token, verify_token
from src.auth.decorators import require_auth
from src.db.models import User, Item
from src.db.session import get_db

app = Flask(__name__)

_IS_DEV = os.getenv("NODE_ENV", "development") == "development"


# ── Core routes ────────────────────────────────────────────────────────────────

@app.get('/')
def hello():
    return jsonify(message="Hello from Flask 3.1", framework="15-flask", version="1.0.0")

@app.get('/health')
def health():
    return jsonify(status='ok', version='1.0.0')

@app.get('/health/live')
def liveness():
    return jsonify(status='ok')

@app.get('/health/ready')
def readiness():
    return jsonify(status='ok')


# ── Auth routes ────────────────────────────────────────────────────────────────

@app.get('/auth/me')
@require_auth
def auth_me():
    return jsonify(user=g.current_user)


@app.post('/auth/logout')
def auth_logout():
    response = jsonify(message='Logged out')
    response.delete_cookie('access_token')
    return response


@app.route('/auth/api-key', methods=['POST', 'DELETE'])
@require_auth
def auth_api_key():
    user_id = g.current_user['id']
    if request.method == 'POST':
        new_key = secrets.token_urlsafe(48)
        with get_db() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify(error='User not found'), 404
            user.api_key = new_key
        return jsonify(api_key=new_key)
    # DELETE
    with get_db() as session:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify(error='User not found'), 404
        user.api_key = None
    return jsonify(message='API key revoked')


@app.post('/dev/token')
def dev_token():
    if not _IS_DEV:
        return jsonify(error='Dev token endpoint is disabled in production'), 403
    body = request.get_json(silent=True) or {}
    email = body.get('email', 'dev@example.com')
    name = body.get('name', 'Dev User')
    with get_db() as session:
        user = session.query(User).filter(User.email == email).first()
        if user is None:
            user = User(email=email, name=name, provider='dev')
            session.add(user)
            session.flush()
        else:
            user.name = name
        token = create_access_token(user_id=user.id, email=user.email, name=user.name)
    return jsonify(access_token=token, token_type='bearer')


# ── Users / Items routes ───────────────────────────────────────────────────────

@app.route('/users/me/items', methods=['GET', 'POST'])
@require_auth
def users_items():
    user_id = g.current_user['id']

    if request.method == 'GET':
        with get_db() as session:
            items = session.query(Item).filter(Item.user_id == user_id).order_by(Item.created_at.desc()).all()
            return jsonify(items=[
                {'id': i.id, 'title': i.title, 'description': i.description, 'user_id': i.user_id}
                for i in items
            ])

    body = request.get_json(silent=True) or {}
    title = body.get('title')
    if not title:
        return jsonify(error='title is required'), 400
    with get_db() as session:
        item = Item(title=title, description=body.get('description'), user_id=user_id)
        session.add(item)
        session.flush()
        return jsonify(item={'id': item.id, 'title': item.title, 'description': item.description, 'user_id': item.user_id}), 201


@app.route('/users/me/items/<int:item_id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def users_item_detail(item_id: int):
    user_id = g.current_user['id']

    if request.method == 'GET':
        with get_db() as session:
            item = session.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
            if not item:
                return jsonify(error='Item not found'), 404
            return jsonify(item={'id': item.id, 'title': item.title, 'description': item.description, 'user_id': item.user_id})

    if request.method == 'PUT':
        body = request.get_json(silent=True) or {}
        with get_db() as session:
            item = session.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
            if not item:
                return jsonify(error='Item not found'), 404
            if body.get('title'):
                item.title = body['title']
            if 'description' in body:
                item.description = body['description']
            return jsonify(item={'id': item.id, 'title': item.title, 'description': item.description, 'user_id': item.user_id})

    # DELETE
    with get_db() as session:
        item = session.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
        if not item:
            return jsonify(error='Item not found'), 404
        session.delete(item)
    return '', 204


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '8080')))
