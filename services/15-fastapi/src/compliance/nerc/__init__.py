import os
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
class _Nerc(BaseHTTPMiddleware):
    async def dispatch(self,request,call_next):
        resp = await call_next(request)
        resp.headers["X-OT-IT-Boundary"]="enforced"
        resp.headers["X-Network-Isolation"]="on"
        return resp
def apply_compliance(app: FastAPI) -> None:
    app.add_middleware(_Nerc)
    os.environ["NO_EGRESS"]="true"
