import pytest
from src.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c

def test_hello(client):
    r = client.get('/')
    assert r.status_code == 200
    assert 'Flask' in r.get_json()['message']

def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    assert r.get_json()['status'] == 'ok'

def test_liveness(client):
    r = client.get('/health/live')
    assert r.status_code == 200

def test_readiness(client):
    r = client.get('/health/ready')
    assert r.status_code == 200
