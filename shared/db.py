"""Single shared SQLAlchemy engine/session for the local Postgres instance.

Both the grievance module and the DAL's device_state persistence use this —
one connection pool, one source of truth on disk (CONTRACT.md §5).
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://gramseva:gramseva@localhost:5432/gramseva"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
