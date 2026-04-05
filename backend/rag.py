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

# ── Embedding model (Lazy Load) ───────────────────────────────────────────────
_EMBED_FN = None

def get_embedding_fn():
    global _EMBED_FN
    if _EMBED_FN is None:
        logger.info("Initializing SentenceTransformer model (all-MiniLM-L6-v2)...")
        _EMBED_FN = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
    return _EMBED_FN

# ── ChromaDB client ───────────────────────────────────────────────────────────
_client = chromadb.PersistentClient(path=_DB_PATH)

def get_collection(name: str):
    """Retrieve collection with the appropriate embedding function."""
    return _client.get_or_create_collection(
        name=name,
        embedding_function=get_embedding_fn(),
        metadata={"hnsw:space": "cosine"},
    )

def init_collections():
    """Warms up the collections and downloads models if necessary."""
    get_collection("notes_index")
    get_collection("chat_history_index")
    get_collection("notion_index")

# ── Notes ─────────────────────────────────────────────────────────────────────

def embed_and_upsert_note(note_id: int, title: str, content: str, user_id: int) -> None:
    """Index (or re-index) a note.  Safe to call on create AND update."""
    text = f"{title}\n{content}".strip()
    if not text:
        return
    try:
        col = get_collection("notes_index")
        col.upsert(
            ids=[f"note-{note_id}"],
            documents=[text],
            metadatas=[{"user_id": user_id, "note_id": note_id, "title": title}],
        )
    except Exception as exc:
        logger.warning("RAG notes upsert failed: %s", exc)


def delete_note_embedding(note_id: int) -> None:
    """Remove a note from the vector index."""
    try:
        col = get_collection("notes_index")
        col.delete(ids=[f"note-{note_id}"])
    except Exception as exc:
        logger.warning("RAG notes delete failed: %s", exc)


def search_notes(query: str, user_id: int, k: int = 5) -> list[str]:
    """Return up to k relevant note snippets for this user."""
    try:
        col = get_collection("notes_index")
        count = col.count()
        if count == 0:
            return []
        results = col.query(
            query_texts=[query],
            n_results=min(k, count),
            where={"user_id": user_id},
        )
        docs = results.get("documents", [[]])[0]
        dist = results.get("distances", [[]])[0]
        
        # Filter by distance (relevance)
        # Cosine distance: 0 is identical, 2 is opposite. 0.5 is a decent balance.
        relevant_docs = []
        for d, doc in zip(dist, docs):
            if doc and d < 0.5:
                relevant_docs.append(doc[:800])
        return relevant_docs
    except Exception as exc:
        logger.warning("RAG notes search failed: %s", exc)
        return []

def get_all_notes(user_id: int) -> list[str]:
    """Retrieve all notes for a user regardless of semantic similarity."""
    try:
        col = get_collection("notes_index")
        results = col.get(
            where={"user_id": user_id},
            include=["documents"]
        )
        return results.get("documents", [])
    except Exception as exc:
        logger.warning("RAG get all notes failed: %s", exc)
        return []

# ── Chat history ──────────────────────────────────────────────────────────────

def upsert_chat_turn(msg_id: int, user_msg: str, assistant_msg: str, user_id: int) -> None:
    """Store a completed Q&A turn so it can be retrieved as few-shot context."""
    text = f"User: {user_msg}\nAssistant: {assistant_msg}"
    try:
        col = get_collection("chat_history_index")
        col.upsert(
            ids=[f"chat-{msg_id}"],
            documents=[text],
            metadatas=[{"user_id": user_id}],
        )
    except Exception as exc:
        logger.warning("RAG chat upsert failed: %s", exc)


def search_chat_history(query: str, user_id: int, k: int = 3) -> list[str]:
    """Return up to k past Q&A turns similar to the current query."""
    try:
        col = get_collection("chat_history_index")
        count = col.count()
        if count == 0:
            return []
        results = col.query(
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

# ── Notion Intelligence ──────────────────────────────────────────────────────

def upsert_notion_page(page_id: str, title: str, content: str, user_id: int) -> None:
    """Index Notion content. Safe to call on re-sync."""
    text = f"NOTION PAGE: {title}\n\n{content}".strip()
    if not text:
        return
    try:
        col = get_collection("notion_index")
        col.upsert(
            ids=[f"notion-{page_id}"],
            documents=[text],
            metadatas=[{"user_id": user_id, "page_id": page_id, "title": title}],
        )
    except Exception as exc:
        logger.warning("RAG notion upsert failed: %s", exc)

def search_notion(query: str, user_id: int, k: int = 3) -> list[str]:
    """Search your private Notion workspace for relevant context."""
    try:
        col = get_collection("notion_index")
        count = col.count()
        if count == 0:
            return []
        results = col.query(
            query_texts=[query],
            n_results=min(k, count),
            where={"user_id": user_id},
        )
        docs = results.get("documents", [[]])[0]
        dist = results.get("distances", [[]])[0]
        
        relevant_docs = []
        for d, doc in zip(dist, docs):
            if doc and d < 0.45:
                # Notion pages can be long, but we only want the relevant snippet
                relevant_docs.append(doc[:1000])
        return relevant_docs
    except Exception as exc:
        logger.warning("RAG notion search failed: %s", exc)
        return []
