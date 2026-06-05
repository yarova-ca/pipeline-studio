from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from src.logger import logger
class _Soc2Audit(BaseHTTPMiddleware):
    async def dispatch(self,request,call_next):
        logger.info("soc2_audit",actor=request.headers.get("x-user-id","anon"),
                    action=request.method,resource=request.url.path)
        return await call_next(request)
def apply_compliance(app: FastAPI) -> None:
    app.add_middleware(_Soc2Audit)
    app.debug = False
