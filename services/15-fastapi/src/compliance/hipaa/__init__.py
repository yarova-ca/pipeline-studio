from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from src.logger import logger
_PHI = {"ssn","dob","mrn","diagnosis","patient_name","address","phone"}
def _mask(o):
    if isinstance(o,dict): return {k:("***REDACTED***" if k in _PHI else _mask(v)) for k,v in o.items()}
    if isinstance(o,list): return [_mask(x) for x in o]
    return o
class _HipaaAudit(BaseHTTPMiddleware):
    async def dispatch(self,request,call_next):
        logger.info("hipaa_audit",actor=request.headers.get("x-user-id","anon"),
                    action=request.method,resource=request.url.path)
        return await call_next(request)
def apply_compliance(app: FastAPI) -> None:
    app.add_middleware(_HipaaAudit)
    app.debug = False
