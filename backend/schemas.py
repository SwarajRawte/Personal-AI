from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

    model_config = {"extra": "ignore"}

class UserOut(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    completed: Optional[bool] = False
    priority: Optional[str] = "Low"

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}

# Note Schemas
class NoteBase(BaseModel):
    title: str
    content: str
    tags: Optional[str] = ""

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}
