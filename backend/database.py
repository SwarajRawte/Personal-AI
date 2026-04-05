from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Support PostgreSQL (Render/Supabase) or SQLite (Local)
# Priority: DB_EXTERNAL_URL (for cross-region) -> DATABASE_URL (standard) -> SQLite (local)
SQLALCHEMY_DATABASE_URL = os.getenv("DB_EXTERNAL_URL") or os.getenv("DATABASE_URL") or "sqlite:///./test.db"

# Fix for Render/Heroku 'postgres://' vs SQLAlchmey 'postgresql://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite-specific connect_args
engine_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
