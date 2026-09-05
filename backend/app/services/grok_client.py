import os
import logging
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

GROK_SYSTEM_INSTRUCTION = """
You are Grok, an ultra-intuitive AI Educator developed by xAI.
Your role is to analyze a lesson plan and produce deep, creative real-world analogies, high-impact intuitive breakdowns, and engaging narration beats for students.
Focus on clarity, engaging storytelling, and deep conceptual insights.
"""

def generate_grok_explanation(prompt: str, system_instruction: str = "") -> Optional[str]:
    """
    Invokes xAI Grok API (https://api.x.ai/v1/chat/completions).
    Returns raw text string response from Grok, or None if key is unconfigured or request fails.
    """
    grok_key = settings.GROK_API_KEY or os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY")
    if not grok_key or "your_" in grok_key:
        logger.info("GROK_API_KEY is missing or placeholder. Skipping Grok call.")
        return None

    grok_model = settings.GROK_MODEL or "grok-beta"
    url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {grok_key}",
        "Content-Type": "application/json"
    }

    messages = []
    sys_prompt = system_instruction or GROK_SYSTEM_INSTRUCTION
    messages.append({"role": "system", "content": sys_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": grok_model,
        "messages": messages,
        "temperature": 0.6
    }

    try:
        logger.info(f"Invoking Grok API model '{grok_model}' for study material enrichment...")
        res = requests.post(url, json=payload, headers=headers, timeout=30)
        if res.status_code == 200:
            data = res.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                content = choices[0]["message"].get("content", "").strip()
                logger.info("Successfully received creative insights from Grok API.")
                return content
        else:
            logger.warning(f"Grok API response error ({res.status_code}): {res.text}")
    except Exception as e:
        logger.warning(f"Failed to communicate with Grok API: {e}")

    return None
