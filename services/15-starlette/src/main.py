from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from dotenv import load_dotenv
import os

load_dotenv()

def hello(request: Request):
    return JSONResponse({"message": "Hello from Starlette 0.41", "framework": "15-starlette", "version": "1.0.0"})

def health(request: Request):
    return JSONResponse({"status": "ok", "version": "1.0.0"})

def liveness(request: Request):
    return JSONResponse({"status": "ok"})

def readiness(request: Request):
    return JSONResponse({"status": "ok"})

app = Starlette(routes=[
    Route('/', hello),
    Route('/health', health),
    Route('/health/live', liveness),
    Route('/health/ready', readiness),
])

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '8080')))
