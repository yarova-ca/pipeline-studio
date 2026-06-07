import os
from fastapi import FastAPI, Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
class _PciTls(BaseHTTPMiddleware):
    async def dispatch(self,request,call_next):
        if request.headers.get("x-forwarded-proto")=="http":
            return JSONResponse({"error":"PCI: TLS required"},status_code=403)
        if request.url.path.startswith("/debug") or request.url.path=="/metrics":
            return JSONResponse({"error":"not found"},status_code=404)
        resp = await call_next(request)
        resp.headers["X-PCI-DSS"]="enforced"
        resp.headers["Strict-Transport-Security"]="max-age=63072000; includeSubDomains; preload"
        return resp
def apply_compliance(app: FastAPI) -> None:
    for k,v in os.environ.items():
        if any(s in k.upper() for s in ("SECRET","KEY","TOKEN","PASS")) and v and len(v)<16:
            raise RuntimeError(f"PCI: {k} weak/plaintext secret (<16 chars)")
    app.add_middleware(_PciTls)
