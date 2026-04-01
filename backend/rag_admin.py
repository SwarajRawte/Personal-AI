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
import notion_service

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
    notion_count: int


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def get_stats(current_user: models.User = Depends(get_current_user)):
    """Return how many items are in each collection (user-scoped approximation)."""
    try:
        notes_total = rag_engine.notes_col.count()
        chat_total  = rag_engine.chat_col.count()
        notion_total = rag_engine.notion_col.count()
    except Exception:
        notes_total = chat_total = notion_total = 0
    return StatsResponse(notes_count=notes_total, chat_count=chat_total, notion_count=notion_total)


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

@router.post("/notion/sync")
def sync_notion_workspace(current_user: models.User = Depends(get_current_user)):
    """Fetch all shared Notion pages and re-index them into ChromaDB."""
    if not notion_service.notion.is_active():
        raise HTTPException(status_code=412, detail="NOTION_SECRET is not set in .env")
    
    try:
        # 1. Search for all accessible pages
        pages = notion_service.notion.search_accessible_pages()
        if not pages:
            return {"status": "ok", "synced": 0, "message": "No shared pages found. Make sure to 'Connect' your integration to Notion pages."}
        
        synced_count = 0
        for p in pages:
            content = notion_service.notion.get_page_content(p["id"])
            if content:
                rag_engine.upsert_notion_page(
                    page_id=p["id"],
                    title=p["title"],
                    content=content,
                    user_id=current_user.id
                )
                synced_count += 1
        
        return {"status": "ok", "synced": synced_count, "total_found": len(pages)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notion sync failed: {str(e)}")


@router.delete("/clear")
def clear_knowledge(current_user: models.User = Depends(get_current_user)):
    """Delete all manually-ingested, note-based, and notion embeddings for this user."""
    try:
        # 1. Clear Notes collection
        all_notes = rag_engine.notes_col.get(where={"user_id": current_user.id})
        n_ids = all_notes.get("ids", [])
        if n_ids:
            rag_engine.notes_col.delete(ids=n_ids)
            
        # 2. Clear Notion collection
        all_notion = rag_engine.notion_col.get(where={"user_id": current_user.id})
        notion_ids = all_notion.get("ids", [])
        if notion_ids:
            rag_engine.notion_col.delete(ids=notion_ids)
            
        return {"status": "ok", "deleted_notes": len(n_ids), "deleted_notion": len(notion_ids)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
