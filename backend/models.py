from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    tasks = relationship("Task", back_populates="owner")
    notes = relationship("Note", back_populates="owner")
    conversations = relationship("Conversation", back_populates="owner")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, default="")
    completed = Column(Boolean, default=False)
    priority = Column(String, default="Low") # High, Medium, Low
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="tasks")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    tags = Column(String, default="") # Comma-separated AI tags
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="notes")

# ── Chat memory ───────────────────────────────────────────────────────────────

class Conversation(Base):
    """One logical chat session (thread)."""
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, index=True)   # UUID from frontend
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, default="New Chat")           # auto-set from 1st msg
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation",
                            order_by="Message.id", cascade="all, delete-orphan")

class Message(Base):
    """A single turn inside a conversation."""
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String)        # "user" | "assistant" | "system"
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
