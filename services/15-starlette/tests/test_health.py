import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest.mark.anyio
async def test_hello():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/')
        assert r.status_code == 200
        assert 'Starlette' in r.json()['message']

@pytest.mark.anyio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health')
        assert r.status_code == 200
        assert r.json()['status'] == 'ok'

@pytest.mark.anyio
async def test_liveness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health/live')
        assert r.status_code == 200

@pytest.mark.anyio
async def test_readiness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health/ready')
        assert r.status_code == 200
