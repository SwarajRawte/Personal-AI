import os
import re
import uuid
from pathlib import Path
import time

from typing import List, Optional

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io
import base64

import models
import rag
import tools
import notion_service
from huggingface_hub import InferenceClient
from database import Base, engine
from dependencies import get_db, get_current_user

# Load .env using absolute path so it works regardless of uvicorn cwd
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# Ensure new tables exist
Base.metadata.create_all(bind=engine)

router = APIRouter()

# ── HCL AI Cafe ───────────────────────────────────────────────────────────────
HCL_API_KEY     = os.environ.get("HCL_API_KEY", "")
HCL_API_BASE    = os.environ.get("HCL_API_BASE", "https://aicafe.hcl.com/AICafeService/api/v1/subscription/openai")
HCL_API_VERSION = os.environ.get("HCL_API_VERSION", "2024-12-01-preview")
HCL_DEPLOYMENT  = os.environ.get("HCL_DEPLOYMENT", "gpt-4.1")

# ── Groq ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions"

# ── Google Gemini ──────────────────────────────────────────────────────────────
# We now load the key dynamically inside the call function to ensure it picks up .env changes immediately.

HF_API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "")

# Static directory for generated images
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

# Model registry
MODEL_REGISTRY = {
    "hcl":               {"provider": "hcl",  "model_id": HCL_DEPLOYMENT,                         "label": "GPT-4.1"},
    "groq-llama-3.3-70b":{"provider": "groq", "model_id": "llama-3.3-70b-versatile",              "label": "Llama 3.3 70B"},
    "groq-deepseek-r1":  {"provider": "groq", "model_id": "llama-3.3-70b-versatile",              "label": "Llama 3.3 70B (Stable)"},
    "groq-llama-3.1-8b": {"provider": "groq", "model_id": "llama-3.1-8b-instant",                 "label": "Llama 3.1 8B"},
    "hf-deepseek-coder": {"provider": "hf",   "model_id": "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct", "label": "DeepSeek Coder (HF)"},
    "hf-mistral":        {"provider": "hf",   "model_id": "mistralai/Mistral-7B-Instruct-v0.3",       "label": "Mistral 7B (HF)"},
    "hf-flux":           {"provider": "hf-img", "model_id": "black-forest-labs/FLUX.1-schnell",       "label": "FLUX.1 Image (HF)"},
    "google-gemini":     {"provider": "google", "model_id": "gemini-2.5-flash",              "label": "Gemini 2.5 Flash"},
    "auto":              {"provider": "auto",   "model_id": "dynamic",                               "label": "Auto Select"},
}

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class HistoryMessage(BaseModel):
    role: str       # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    model: str = "hcl"
    session_id: Optional[str] = None        # omit to start a new session
    history: List[HistoryMessage] = []      # previous turns from the frontend
    image_base64: Optional[str] = None      # vision support

class ChatResponse(BaseModel):
    response: str
    session_id: str
    rag_used: bool = False
    image_url: Optional[str] = None
    model_used: Optional[str] = None
    search_used: bool = False

# ── Helpers ───────────────────────────────────────────────────────────────────

def _strip_think(text: str) -> str:
    """Remove <think>…</think> reasoning blocks (Qwen3, DeepSeek-R1, etc.)."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _build_system_prompt(note_snippets: list[str], chat_snippets: list[str], search_results: str = "", notion_snippets: list[str] = []) -> str:
    parts = [
        "You are Kortex, a high-intelligence personal assistant. "
        "Be concise, accurate, and friendly."
    ]
    if note_snippets:
        parts.append("\n\n## Relevant notes from the user's knowledge base:\n" +
                     "\n---\n".join(note_snippets))
    if notion_snippets:
        parts.append("\n\n## Documents from your Notion Workspace:\n" +
                     "\n---\n".join(notion_snippets))
    if chat_snippets:
        parts.append("\n\n## Similar past conversations for context:\n" +
                     "\n---\n".join(chat_snippets))
    if search_results:
        parts.append("\n\n## Real-time Web Search Results:\n" + search_results)
    return "\n".join(parts)


def _call_hcl(messages: list[dict]) -> str:
    if not HCL_API_KEY or HCL_API_KEY == "your-hcl-api-key-here":
        raise HTTPException(status_code=500, detail="HCL_API_KEY is not set in backend/.env")
    url = f"{HCL_API_BASE}/deployments/{HCL_DEPLOYMENT}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "api-key": HCL_API_KEY,
        "Ocp-Apim-Subscription-Key": HCL_API_KEY,
    }
    resp = http_requests.post(url, json={"messages": messages}, headers=headers,
                              params={"api-version": HCL_API_VERSION}, timeout=30)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _call_groq(messages: list[dict], model_id: str) -> str:
    if not GROQ_API_KEY or GROQ_API_KEY == "your-groq-api-key-here":
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set in backend/.env")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }
    payload = {"model": model_id, "messages": messages}
    resp = http_requests.post(GROQ_API_BASE, json=payload, headers=headers, timeout=30)
    if not resp.ok:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=resp.status_code,
                            detail=f"Groq error ({resp.status_code}): {detail}")
    return _strip_think(resp.json()["choices"][0]["message"]["content"])


def _call_huggingface_text(messages: list[dict], model_id: str) -> str:
    if not HF_API_KEY or "your_hf_token_here" in HF_API_KEY:
        raise HTTPException(status_code=500, detail="HUGGINGFACE_API_KEY is not set in backend/.env")
    
    try:
        client = InferenceClient(api_key=HF_API_KEY)
        response = client.chat_completion(
            model=model_id,
            messages=messages,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        err_msg = str(e)
        if "403" in err_msg or "permissions" in err_msg:
            raise HTTPException(status_code=403, detail="Hugging Face 403: Inference API permission missing. Please check your token scopes.")
        raise HTTPException(status_code=500, detail=f"HF Inference Error: {err_msg}")


def _call_gemini(messages: list[dict], model_id: str, image_base64: Optional[str] = None) -> str:
    # Force reload of .env to pick up manual updates without server restart
    load_dotenv(dotenv_path=_env_path, override=True)
    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key or "PASTE_YOUR_GEMINI_KEY" in api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is missing or invalid in backend/.env")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_id)
        
        last_msg = messages[-1]["content"]
        
        # 1. Handle Multi-modal (Image + Text)
        if image_base64:
            # Note: Current Gemini SDK 'start_chat' does not support multi-modal history well.
            # For vision tasks, we send the prompt + image as a single generation.
            image_data = base64.b64decode(image_base64)
            img = Image.open(io.BytesIO(image_data))
            response = model.generate_content([last_msg, img])
            return response.text
            
        # 2. Regular Text Chat (with history)
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            if role == "system": role = "user" # Gemini doesn't support system role in history well
            history.append({"role": role, "parts": [msg["content"]]})
        
        chat = model.start_chat(history=history)
        response = chat.send_message(last_msg)
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini Error: {str(e)}")


def _call_huggingface_image(prompt: str) -> str:
    """Returns a local URL to the generated image."""
    if not HF_API_KEY or "your_hf_token_here" in HF_API_KEY:
        raise HTTPException(status_code=500, detail="HUGGINGFACE_API_KEY is not set in backend/.env")
    
    try:
        model_id = "black-forest-labs/FLUX.1-schnell"
        client = InferenceClient(api_key=HF_API_KEY)
        
        # text_to_image handles the correct endpoint for image models
        image = client.text_to_image(prompt, model=model_id)
        
        # Save image
        img_filename = f"gen_{int(time.time())}.png"
        img_path = os.path.join(STATIC_DIR, img_filename)
        image.save(img_path)
        
        return f"/static/{img_filename}"
    except Exception as e:
        err_msg = str(e)
        if "403" in err_msg or "permissions" in err_msg:
            raise HTTPException(status_code=403, detail="Hugging Face 403: Image Inference permission missing. Ensure 'Make calls to Inference Providers' is checked in your HF token settings.")
        raise HTTPException(status_code=500, detail=f"HF Image Error: {err_msg}")


def _get_auto_model(message: str, has_image: bool = False) -> str:
    """Intelligently route the request to the best model based on intent."""
    m = message.lower()
    
    # 0. Vision intent (Force Gemini if an image is provided)
    if has_image:
        return "google-gemini"
    
    # 1. Coding intent (Route to Groq for speed/reliability)
    code_kws = ["python", "javascript", "js", "ts", "typescript", "rust", "code", "function", "css", "html", "react", "java", "c++", "c#", "golang", "sql", "ruby", "php", "snippet", "repository"]
    if any(kw in m for kw in code_kws):
        return "groq-deepseek-r1"
    
    # 2. Image intent (Require more specific keywords to avoid code generation collision)
    img_kws = ["draw", "image", "picture", "art", "sketch", "illustration", "generate image", "create art", "make a photo", "visualize"]
    if any(kw in m for kw in img_kws):
        return "hf-flux"
    
    # 3. Reasoning intent (Specific analysis keywords)
    reason_kws = ["why", "how", "complex", "reason", "step by step", "analyze", "explain in depth", "logic", "proof"]
    if any(kw in m for kw in reason_kws):
        return "groq-deepseek-r1"
    
    # Default: Robust general model
    return "groq-llama-3.3-70b"


# ── Main chat endpoint ────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    entry = MODEL_REGISTRY.get(request.model)
    if not entry:
        raise HTTPException(status_code=400, detail=f"Unknown model key: {request.model}")

    # ── 1. RAG & Search context retrieval ──────────────────────────────────────────────
    msg_lower = request.message.lower().strip()
    
    # Check for general intent to see all knowledge
    list_notes_kws = ["what are my notes", "list all my notes", "show my notes", "what do i have in my notes", "all my notes"]
    if any(kw in msg_lower for kw in list_notes_kws):
        note_snippets = rag.get_all_notes(current_user.id)
    else:
        note_snippets = rag.search_notes(request.message, current_user.id)
        
    chat_snippets = rag.search_chat_history(request.message, current_user.id)
    notion_snippets = rag.search_notion(request.message, current_user.id)
    
    # ── Web Search Detection ────────────────────────────────────────────────
    search_results = ""
    search_used = False
    
    search_kws = ["search", "latest", "news", "current", "today", "who is", "weather", "stock", "price"]
    
    if msg_lower.startswith("/search ") or any(kw in msg_lower for kw in search_kws):
        query = msg_lower[8:].strip() if msg_lower.startswith("/search ") else request.message
        search_results = tools.web_search(query)
        search_used = True

    rag_used = bool(note_snippets or chat_snippets or notion_snippets)

    # ── 2. Build message array (system + history + current user msg) ──────────
    system_prompt = _build_system_prompt(note_snippets, chat_snippets, search_results, notion_snippets)
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for h in request.history:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": request.message})

    # ── 3. Detect /image command or call AI ────────────────────────────────────
    reply = ""
    image_url = None
    
    try:
        # Check for /image command regardless of selected model
        if request.message.strip().lower().startswith("/image "):
            prompt = request.message.strip()[7:].strip()
            image_url = _call_huggingface_image(prompt)
            reply = f"I've generated that image for you based on the prompt: '{prompt}'"
            model_used = "FLUX.1 (HF)"
        else:
            # Handle Auto-Select if requested
            actual_model_key = request.model
            if request.model == "auto":
                actual_model_key = _get_auto_model(request.message, bool(request.image_base64))
            
            entry = MODEL_REGISTRY.get(actual_model_key)
            model_used = entry["label"]
            
            if entry["provider"] == "hf-img":
                image_url = _call_huggingface_image(request.message)
                reply = f"I've generated that image for you using {model_used}."
            elif entry["provider"] == "groq":
                reply = _call_groq(messages, entry["model_id"])
            elif entry["provider"] == "hf":
                reply = _call_huggingface_text(messages, entry["model_id"])
            elif entry["provider"] == "google":
                reply = _call_gemini(messages, entry["model_id"], request.image_base64)
            else:
                reply = _call_hcl(messages)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # ── 4. Persist to SQLite ──────────────────────────────────────────────────
    session_id = request.session_id or str(uuid.uuid4())

    # Get or create conversation
    conv = db.query(models.Conversation).filter_by(
        id=session_id, user_id=current_user.id
    ).first()
    if not conv:
        # Use first 60 chars of user's first message as title
        title = request.message[:60] + ("…" if len(request.message) > 60 else "")
        conv = models.Conversation(id=session_id, user_id=current_user.id, title=title)
        db.add(conv)
        db.flush()

    user_msg_row = models.Message(
        conversation_id=session_id, role="user", content=request.message
    )
    asst_msg_row = models.Message(
        conversation_id=session_id, role="assistant", content=reply
    )
    db.add_all([user_msg_row, asst_msg_row])
    db.commit()
    db.refresh(asst_msg_row)

    # ── 5. Index this turn in RAG ─────────────────────────────────────────────
    rag.upsert_chat_turn(asst_msg_row.id, request.message, reply, current_user.id)

    return {
        "response": reply,
        "session_id": session_id,
        "rag_used": rag_used,
        "search_used": search_used,
        "image_url": image_url,
        "model_used": model_used
    }

# ── Session management endpoints ──────────────────────────────────────────────

@router.get("/chat/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all conversations for the current user (newest first)."""
    convs = (
        db.query(models.Conversation)
        .filter_by(user_id=current_user.id)
        .order_by(models.Conversation.created_at.desc())
        .all()
    )
    return [
        {"id": c.id, "title": c.title, "created_at": str(c.created_at)}
        for c in convs
    ]

@router.get("/chat/sessions/{session_id}")
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return full message history for a session."""
    conv = db.query(models.Conversation).filter_by(
        id=session_id, user_id=current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": conv.id,
        "title": conv.title,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": str(m.created_at)}
            for m in conv.messages
        ],
    }

# ── Model list ────────────────────────────────────────────────────────────────

@router.get("/models")
def list_models():
    return [
        {"key": k, "label": v["label"], "provider": v["provider"]}
        for k, v in MODEL_REGISTRY.items()
    ]

# ── Training-data export ──────────────────────────────────────────────────────

@router.get("/export/training-data")
def export_training_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Export all conversations as JSONL in OpenAI fine-tuning format.
    Each line is a JSON object with a 'messages' key.
    Download: GET /export/training-data
    """
    import json

    convs = (
        db.query(models.Conversation)
        .filter_by(user_id=current_user.id)
        .all()
    )

    SYSTEM_MSG = {
        "role": "system",
        "content": "You are a helpful personal AI assistant. Be concise, accurate, and friendly.",
    }

    def generate():
        for conv in convs:
            msgs = [m for m in conv.messages if m.role in ("user", "assistant")]
            if len(msgs) < 2:
                continue
            record = {
                "messages": [SYSTEM_MSG] + [
                    {"role": m.role, "content": m.content} for m in msgs
                ]
            }
            yield json.dumps(record) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "Content-Disposition": f'attachment; filename="training_data_{current_user.username}.jsonl"'
        },
    )
