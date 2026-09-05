# SCHEMA MIGRATION NOTE:
# SQLModel.metadata.create_all() only creates missing tables for new database instances;
# it does NOT perform automated database schema migrations or alter existing tables/columns.
# This project intentionally does not include an automated migration tool (e.g., Alembic).
# If database schema models change in future phases, either point at a fresh empty database
# instance or manually execute SQL ALTER TABLE statements on the target database.

import os
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

def get_engine_and_url():
    """
    Constructs the SQLAlchemy engine dynamically based on application configuration.
    If DATABASE_URL is set (e.g. Supabase Session Pooler connection string in production),
    uses Postgres with pool_pre_ping=True to transparently recover stale connections.
    Otherwise, defaults to local SQLite persistence for zero-setup development.
    """
    db_url = settings.DATABASE_URL
    if db_url and db_url.strip():
        db_url_str = db_url.strip()
        # Normalize postgres:// to postgresql:// if needed for SQLAlchemy
        if db_url_str.startswith("postgres://"):
            db_url_str = "postgresql://" + db_url_str[len("postgres://"):]
        
        # Create Postgres engine with connection pre-pinging for resilience
        return create_engine(db_url_str, echo=False, pool_pre_ping=True)
    else:
        # Fallback to local SQLite database
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_file_path = os.path.join(BASE_DIR, settings.DATABASE_PATH)
        os.makedirs(os.path.dirname(db_file_path), exist_ok=True)
        sqlite_url = f"sqlite:///{db_file_path}"
        connect_args = {"check_same_thread": False}
        return create_engine(sqlite_url, echo=False, connect_args=connect_args)

engine = get_engine_and_url()

def create_db_and_tables():
    """Creates database tables defined in SQLModel models."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """FastAPI Dependency yielding a database session."""
    with Session(engine) as session:
        yield session
