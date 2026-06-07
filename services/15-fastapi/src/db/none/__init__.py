"""ORM variant: none — no-op stubs, no database connection required."""

from typing import AsyncGenerator


async def get_db() -> AsyncGenerator:
    yield None


async def init_db() -> None:
    return None


async def close_db() -> None:
    return None
