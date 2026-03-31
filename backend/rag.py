"""
rag.py — ChromaDB-backed vector store for PersonalAI.

Two collections:
  • notes_index      — user notes (embed on create/update, delete on note delete)
  • chat_history_index — past chat turns (embed after every AI reply)

Embeddings use sentence-transformers all-MiniLM-L6-v2 (80 MB, CPU-friendly).
The DB persists to ./chroma_db/ next to this file.
"""
from __future__ import annotations

import logging
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

# ── Persistent storage path ───────────────────────────────────────────────────
_DB_PATH = str(Path(__file__).parent / "chroma_db")

# ── Embedding model (downloaded once, cached locally) ────────────────────────
_EMBED_FN = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# ── ChromaDB client + collections ─────────────────────────────────────────────
_client = chromadb.PersistentClient(path=_DB_PATH)

notes_col = _client.get_or_create_collection(
    name="notes_index",
    embedding_function=_EMBED_FN,
    metadata={"hnsw:space": "cosine"},
)

chat_col = _client.get_or_create_collection(
    name="chat_history_index",
    embedding_function=_EMBED_FN,
    metadata={"hnsw:space": "cosine"},
)

# ── Notes ─────────────────────────────────────────────────────────────────────

def embed_and_upsert_note(note_id: int, title: str, content: str, user_id: int) -> None:
    """Index (or re-index) a note.  Safe to call on create AND update."""
    text = f"{title}\n{content}".strip()
    if not text:
        return
    try:
        notes_col.upsert(
            ids=[f"note-{note_id}"],
            documents=[text],
            metadatas=[{"user_id": user_id, "note_id": note_id, "title": title}],
        )
    except Exception as exc:
        logger.warning("RAG notes upsert failed: %s", exc)


def delete_note_embedding(note_id: int) -> None:
    """Remove a note from the vector index."""
    try:
        notes_col.delete(ids=[f"note-{note_id}"])
    except Exception as exc:
        logger.warning("RAG notes delete failed: %s", exc)


def search_notes(query: str, user_id: int, k: int = 3) -> list[str]:
    """Return up to k relevant note snippets for this user."""
    try:
        count = notes_col.count()
        if count == 0:
            return []
        results = notes_col.query(
            query_texts=[query],
            n_results=min(k, count),
            where={"user_id": user_id},
        )
        docs = results.get("documents", [[]])[0]
        dist = results.get("distances", [[]])[0]
        
        # Filter by distance (relevance)
        # Cosine distance: 0 is identical, 2 is opposite. 0.45 is a decent threshold.
        relevant_docs = []
        for d, doc in zip(dist, docs):
            if doc and d < 0.45:
                relevant_docs.append(doc[:600])
        return relevant_docs
    except Exception as exc:
        logger.warning("RAG notes search failed: %s", exc)
        return []

# ── Chat history ──────────────────────────────────────────────────────────────

def upsert_chat_turn(msg_id: int, user_msg: str, assistant_msg: str, user_id: int) -> None:
    """Store a completed Q&A turn so it can be retrieved as few-shot context."""
    text = f"User: {user_msg}\nAssistant: {assistant_msg}"
    try:
        chat_col.upsert(
            ids=[f"chat-{msg_id}"],
            documents=[text],
            metadatas=[{"user_id": user_id}],
        )
    except Exception as exc:
        logger.warning("RAG chat upsert failed: %s", exc)


def search_chat_history(query: str, user_id: int, k: int = 3) -> list[str]:
    """Return up to k past Q&A turns similar to the current query."""
    try:
        count = chat_col.count()
        if count == 0:
            return []
        results = chat_col.query(
            query_texts=[query],
            n_results=min(k, count),
            where={"user_id": user_id},
        )
        docs = results.get("documents", [[]])[0]
        dist = results.get("distances", [[]])[0]
        
        relevant_docs = []
        for d, doc in zip(dist, docs):
            if doc and d < 0.45:
                relevant_docs.append(doc[:800])
        return relevant_docs
    except Exception as exc:
        logger.warning("RAG chat history search failed: %s", exc)
        return []
