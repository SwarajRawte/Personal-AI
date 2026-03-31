import logging
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

def web_search(query: str, max_results: int = 4) -> str:
    """Perform a live web search and return a summarized string of results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            if not results:
                return "No search results found."
            
            output = []
            for r in results:
                title = r.get("title", "No Title")
                snippet = r.get("body", "No Snippet")
                link = r.get("href", "#")
                output.append(f"Source: {title}\nContent: {snippet}\nLink: {link}")
            
            return "\n\n---\n\n".join(output)
    except Exception as e:
        logger.error(f"Web search failed: {str(e)}")
        return f"Search failed: {str(e)}"
