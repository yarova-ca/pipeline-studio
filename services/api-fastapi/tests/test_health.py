import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_hello():
    r = client.get("/")
    assert r.status_code == 200
    assert "FastAPI" in r.json()["message"]

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_liveness():
    r = client.get("/health/live")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_readiness():
    r = client.get("/health/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
