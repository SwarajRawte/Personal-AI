"""
rag_admin.py — Admin API routes for inspecting and managing the RAG knowledge base.

Endpoints:
  GET    /api/rag/stats          — counts of indexed notes & chat turns for this user
  POST   /api/rag/ingest         — manually ingest arbitrary text into notes_col
  GET    /api/rag/search?q=...   — semantic search notes for this user
  DELETE /api/rag/clear          — wipe all notes embeddings for this user
"""
from __future__ import annotations

import uuid
from typing import Optional

import io
import pandas as pd
from PyPDF2 import PdfReader
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from dependencies import get_current_user
import models
import rag as rag_engine

router = APIRouter(prefix="/api/rag", tags=["rag-admin"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    text: str
    label: Optional[str] = "manual"   # shown in the UI as the source label


class SearchResponse(BaseModel):
    results: list[str]


class StatsResponse(BaseModel):
    notes_count: int
    chat_count: int


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def get_stats(current_user: models.User = Depends(get_current_user)):
    """Return how many items are in each collection (user-scoped approximation)."""
    try:
        notes_total = rag_engine.notes_col.count()
        chat_total  = rag_engine.chat_col.count()
    except Exception:
        notes_total = chat_total = 0
    return StatsResponse(notes_count=notes_total, chat_count=chat_total)


@router.post("/ingest")
def ingest_text(
    req: IngestRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Manually add a text chunk to the user's knowledge base."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    doc_id = f"manual-{current_user.id}-{uuid.uuid4().hex[:8]}"
    try:
        rag_engine.notes_col.upsert(
            ids=[doc_id],
            documents=[req.text.strip()],
            metadatas=[{
                "user_id": current_user.id,
                "note_id": -1,
                "title": req.label or "manual",
            }],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"status": "ok", "id": doc_id}


@router.get("/search", response_model=SearchResponse)
def search_knowledge(
    q: str = "",
    k: int = 5,
    current_user: models.User = Depends(get_current_user),
):
    """Semantic search across this user's notes knowledge base."""
    if not q.strip():
        return SearchResponse(results=[])
    results = rag_engine.search_notes(q, user_id=current_user.id, k=k)
    return SearchResponse(results=results)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Ingest a PDF, CSV, or Text file into the knowledge base."""
    filename = file.filename.lower()
    content = ""
    
    try:
        # 1. Read file content based on extension
        file_bytes = await file.read()
        
        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            content = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
            content = df.to_string()
        elif filename.endswith(".txt"):
            content = file_bytes.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, CSV, or TXT.")

        if not content.strip():
            raise HTTPException(status_code=400, detail="File is empty or could not be parsed.")

        # 2. Ingest into ChromaDB
        doc_id = f"file-{current_user.id}-{uuid.uuid4().hex[:8]}"
        rag_engine.notes_col.upsert(
            ids=[doc_id],
            documents=[content.strip()],
            metadatas=[{
                "user_id": current_user.id,
                "note_id": -2, # -2 indicates file ingest
                "title": file.filename,
            }],
        )
        return {"status": "ok", "filename": file.filename, "id": doc_id, "chars": len(content)}
        
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(exc)}")

@router.delete("/clear")
def clear_knowledge(current_user: models.User = Depends(get_current_user)):
    """Delete all manually-ingested and note-based embeddings for this user."""
    try:
        # Fetch all IDs that belong to this user in notes_col
        all_items = rag_engine.notes_col.get(where={"user_id": current_user.id})
        ids = all_items.get("ids", [])
        if ids:
            rag_engine.notes_col.delete(ids=ids)
        return {"status": "ok", "deleted": len(ids)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
