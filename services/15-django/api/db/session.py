"""SQLAlchemy sync session factory for Django.

Django does not use async by default, so we use a synchronous engine here.
The same models as 15-fastapi are used; driver is sync psycopg2/aiosqlite.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

_raw_url = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# Convert async driver prefixes to sync for SQLAlchemy sync engine.
if _raw_url.startswith("postgresql+asyncpg://"):
    _raw_url = _raw_url.replace("postgresql+asyncpg://", "postgresql://", 1)
elif _raw_url.startswith("sqlite+aiosqlite://"):
    _raw_url = _raw_url.replace("sqlite+aiosqlite://", "sqlite://", 1)

engine = create_engine(
    _raw_url,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Context manager that yields a database session per request."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
