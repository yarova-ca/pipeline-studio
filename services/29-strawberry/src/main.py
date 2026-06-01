import strawberry
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import uvicorn
import os

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

schema = strawberry.Schema(query=Query)
graphql_router = GraphQLRouter(schema)

app = FastAPI()
app.include_router(graphql_router, prefix="/graphql")

@app.get("/health")
@app.get("/health/live")
@app.get("/health/ready")
def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
