"""Auth variant: none — anonymous passthrough, no token required."""


async def get_current_user() -> dict:
    return {"id": 0, "email": "anonymous", "name": "anonymous", "provider": "none"}
