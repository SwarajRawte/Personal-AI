import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

# Load .env explicitly
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

def verify_and_sync():
    secret = os.environ.get("NOTION_SECRET", "")
    if not secret or "your_notion_secret_here" in secret:
        print("\n[❌ ERROR] NOTION_SECRET is not set in .env!")
        print("Please paste your secret into: backend/.env")
        return

    print("\n[🔍 SEARCHING] Looking for shared Notion pages...")
    
    # We use the Internal API via our sync endpoint to trigger real indexing
    # If the user is running the backend, we hit the API. Otherwise, we mock it.
    url = "http://localhost:8000/api/rag/notion/sync"
    
    try:
        # We need a Dummy Auth or real user session if the backend is strict
        # For simplicity in this standalone script, we'll try hitting the endpoint directly
        # but the backend requires @get_current_user. 
        # INSTEAD: We'll run the logic directly here for immediate feedback.
        
        from notion_service import notion
        import rag
        
        if not notion.is_active():
            print("[❌ ERROR] Notion client failed to initialize with provided secret.")
            return

        pages = notion.search_accessible_pages()
        if not pages:
            print("[⚠️ WARNING] No shared pages found!")
            print("Make sure you:")
            print("1. Go to your Notion page.")
            print("2. Click '...' -> 'Connections' -> 'Connect to' -> 'Kortex'.")
            return

        print(f"[✅ SUCCESS] Found {len(pages)} shared pages.")
        for p in pages:
            print(f"  - {p['title']} (ID: {p['id'][:8]}...)")

        print("\n[🧠 INDEXING] Syncing pages to AI Memory (ChromaDB)...")
        synced = 0
        for p in pages:
            content = notion.get_page_content(p["id"])
            if content:
                # Assuming user_id=1 for the primary personal user
                rag.upsert_notion_page(p["id"], p["title"], content, user_id=1)
                synced += 1
                print(f"  [+] Indexed: {p['title']}")

        print(f"\n[🎉 DONE] Synchronized {synced} pages into your AI intelligence hub.")
        print("You can now ask your assistant questions about these documents!")

    except ImportError:
        print("[❌ ERROR] Make sure to run this via backend_venv!")
        print("Usage: .\\backend_venv\\Scripts\\python.exe verify_notion.py")
    except Exception as e:
        print(f"[❌ ERROR] Integration failed: {str(e)}")

if __name__ == "__main__":
    verify_and_sync()
