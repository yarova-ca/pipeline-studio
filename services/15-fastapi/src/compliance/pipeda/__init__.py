from fastapi import FastAPI, Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
class _Pipeda(BaseHTTPMiddleware):
    async def dispatch(self,request,call_next):
        if request.method in ("POST","PUT","PATCH") and request.headers.get("x-consent")!="granted":
            return JSONResponse({"error":"PIPEDA: consent required"},status_code=451)
        resp = await call_next(request)
        resp.headers["X-Data-Residency"]="CA"
        return resp
def apply_compliance(app: FastAPI) -> None:
    app.add_middleware(_Pipeda)
