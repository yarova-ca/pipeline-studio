import os
from fastapi import FastAPI, Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from src.logger import logger
class _CmmcAudit(BaseHTTPMiddleware):
    async def dispatch(self,request,call_next):
        logger.info("cmmc_audit",actor=request.headers.get("x-user-id","anon"),
                    action=request.method,resource=request.url.path)
        if request.url.path.startswith("/debug"):
            return JSONResponse({"error":"not found"},status_code=404)
        return await call_next(request)
def apply_compliance(app: FastAPI) -> None:
    app.add_middleware(_CmmcAudit)
    app.debug = False
    os.environ["NO_EGRESS"]="true"
