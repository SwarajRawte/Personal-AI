import os
import google.generativeai as genai
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.environ.get("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    logger.warning("GOOGLE_API_KEY not found. AI Smart features will be disabled.")
    model = None

def get_ai_priority(title: str, description: str = "") -> str:
    """Analyze task to determine Priority: High, Medium, or Low."""
    if not model:
        return "Low"
    
    prompt = f"""
    Analyze the following task and return ONLY one word for priority: 'High', 'Medium', or 'Low'.
    Consider urgency and impact.
    
    Task: {title}
    Details: {description}
    
    Priority:
    """
    try:
        response = model.generate_content(prompt)
        priority = response.text.strip().capitalize()
        if priority in ["High", "Medium", "Low"]:
            return priority
        return "Medium"
    except Exception as e:
        logger.error(f"AI Priority analysis failed: {str(e)}")
        return "Low"

def get_ai_tags(title: str, content: str) -> str:
    """Analyze note to generate comma-separated tags."""
    if not model:
        return ""
    
    prompt = f"""
    Generate 2-4 short, relevant tags for this note. 
    Return them ONLY as a comma-separated list.
    
    Title: {title}
    Content: {content[:1000]}
    
    Tags:
    """
    try:
        response = model.generate_content(prompt)
        tags = response.text.strip()
        # Clean up any potential markdown or extra formatting
        tags = tags.replace("#", "").replace("Tags:", "").strip()
        return tags
    except Exception as e:
        logger.error(f"AI Tagging failed: {str(e)}")
        return ""
