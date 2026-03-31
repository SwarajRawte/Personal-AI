from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas, crud, models
from dependencies import get_db, get_current_user
import rag

router = APIRouter()

@router.post("/notes", response_model=schemas.Note)
def create_note(
    note: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_note = crud.create_user_note(db=db, note=note, user_id=current_user.id)
    # Index in RAG vector store
    rag.embed_and_upsert_note(db_note.id, db_note.title, db_note.content, current_user.id)
    return db_note

@router.get("/notes", response_model=List[schemas.Note])
def get_notes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_notes(db, user_id=current_user.id)

@router.put("/notes/{note_id}", response_model=schemas.Note)
def update_note(
    note_id: int,
    note: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == current_user.id
    ).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized")

    db_note.title = note.title
    db_note.content = note.content
    db.commit()
    db.refresh(db_note)

    # Re-index updated note (upsert is idempotent)
    rag.embed_and_upsert_note(db_note.id, db_note.title, db_note.content, current_user.id)
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == current_user.id
    ).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized")

    db.delete(db_note)
    db.commit()

    # Remove from vector index
    rag.delete_note_embedding(note_id)
    return {"ok": True}
