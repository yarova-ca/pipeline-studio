from fastapi import FastAPI
from prometheus_client import make_asgi_app
def init_observability(app): app.mount("/metrics", make_asgi_app())
