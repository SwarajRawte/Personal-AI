import models
from database import engine, Base

def init_db():
    print("⚠️  Warning: Re-initializing Database Schema...")
    # This will drop existing tables to apply the new schema (priority, tags, etc.)
    Base.metadata.drop_all(bind=engine)
    print("🗑️  Old tables dropped.")
    Base.metadata.create_all(bind=engine)
    print("✨ New tables created with Smart Fields (priority, tags).")

if __name__ == "__main__":
    init_db()
