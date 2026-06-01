import pytest
from django.test import Client

@pytest.fixture
def client():
    return Client()

@pytest.mark.django_db
def test_hello(client):
    r = client.get('/')
    assert r.status_code == 200
    assert 'Django' in r.json()['message']

@pytest.mark.django_db
def test_health(client):
    r = client.get('/health/')
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'

@pytest.mark.django_db
def test_liveness(client):
    r = client.get('/health/live')
    assert r.status_code == 200

@pytest.mark.django_db
def test_readiness(client):
    r = client.get('/health/ready')
    assert r.status_code == 200
