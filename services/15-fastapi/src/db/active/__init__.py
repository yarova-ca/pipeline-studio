"""ORM variant: active — populated at build time by Dockerfile ARG ORM.

This file is overwritten by COPY src/db/${ORM}/ ./src/db/active/
The content here matches the 'sqlalchemy' variant as the default.
"""

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# DATABASE_URL must use the async driver prefix.
# postgresql+asyncpg://user:pass@host:5432/dbname
# For SQLite in tests: sqlite+aiosqlite:///./test.db
_raw_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./dev.db")

# Convert plain postgresql:// → postgresql+asyncpg:// when provided without driver.
if _raw_url.startswith("postgresql://"):
    _raw_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _raw_url,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables defined in the metadata (for startup/migration hooks)."""
    from src.db.models import Base  # noqa: PLC0415
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose the engine connection pool (for graceful shutdown)."""
    await engine.dispose()
