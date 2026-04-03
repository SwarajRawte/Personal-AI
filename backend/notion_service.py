import os
import logging
from typing import List, Dict, Any, Optional
from notion_client import Client
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger(__name__)

# Load .env explicitly
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

class NotionService:
    def __init__(self):
        token = os.environ.get("NOTION_SECRET", "")
        if not token or "your_notion_secret_here" in token:
            self.client = None
            logger.warning("NOTION_SECRET is not set in .env. Notion features will be disabled.")
        else:
            self.client = Client(auth=token)

    def is_active(self) -> bool:
        return self.client is not None

    def _get_text_from_block(self, block: Dict[str, Any]) -> str:
        """Extract plain text from various Notion block types."""
        block_type = block.get("type", "")
        content = block.get(block_type, {})
        
        # Handle rich_text blocks (Paragraphs, Headings, Lists, etc.)
        if "rich_text" in content:
            return "".join([t.get("plain_text", "") for t in content["rich_text"]])
        
        # Handle simple text containers
        if block_type == "text":
            return block.get("plain_text", "")
            
        return ""

    def get_page_content(self, page_id: str) -> str:
        """Fetch all blocks for a page and flatten them into a single string."""
        if not self.client:
            return ""
        
        try:
            # 1. Get Page Title
            page = self.client.pages.retrieve(page_id=page_id)
            title = "Untitled"
            properties = page.get("properties", {})
            
            # Find the title property (it's often named 'title' or 'Name')
            for prop in properties.values():
                if prop.get("type") == "title":
                    title = "".join([t.get("plain_text", "") for t in prop.get("title", [])])
                    break
            
            # 2. Get All Blocks (Recursive flattener)
            blocks = self.client.blocks.children.list(block_id=page_id).get("results", [])
            text_blocks = [f"# {title}"]
            
            for block in blocks:
                text = self._get_text_from_block(block).strip()
                if text:
                    text_blocks.append(text)
            
            return "\n\n".join(text_blocks)
        except Exception as e:
            logger.error(f"Failed to fetch Notion page {page_id}: {str(e)}")
            return ""

    def search_accessible_pages(self, query: str = "") -> List[Dict[str, str]]:
        """Search for pages that have been shared with this integration."""
        if not self.client:
            return []
        
        try:
            results = self.client.search(
                query=query,
                filter={"property": "object", "value": "page"},
                sort={"direction": "descending", "timestamp": "last_edited_time"}
            ).get("results", [])
            
            pages = []
            for page in results:
                title = "Untitled"
                for prop in page.get("properties", {}).values():
                    if prop.get("type") == "title":
                        title = "".join([t.get("plain_text", "") for t in prop.get("title", [])])
                        break
                pages.append({"id": page["id"], "title": title})
            
            return pages
        except Exception as e:
            logger.error(f"Notion search failed: {str(e)}")
            return []

# Singleton instance
notion = NotionService()
