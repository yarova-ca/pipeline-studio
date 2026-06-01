from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="FastAPI 0.115")

@app.get("/")
def hello():
    return {"message": "Hello from FastAPI 0.115", "framework": "15-fastapi", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/health/live")
def liveness():
    return {"status": "ok"}

@app.get("/health/ready")
def readiness():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
