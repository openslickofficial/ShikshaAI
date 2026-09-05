import os
import logging
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_SYSTEM_INSTRUCTION = """
You are Groq Cloud AI, an ultra-fast LPU Educator engine developed by Groq.
Your role is to analyze a lesson plan and produce deep, creative real-world analogies, high-impact intuitive breakdowns, and engaging narration beats for students.
Focus on extreme clarity, engaging storytelling, and deep conceptual insights.
"""

def generate_groq_explanation(prompt: str, system_instruction: str = "") -> Optional[str]:
    """
    Invokes Groq Cloud REST API (https://api.groq.com/openai/v1/chat/completions).
    Returns raw text string response from Groq, or None if key is unconfigured or request fails.
    """
    groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if not groq_key or "your_" in groq_key:
        logger.info("GROQ_API_KEY is missing or placeholder. Skipping Groq Cloud call.")
        return None

    groq_model = settings.GROQ_MODEL or "groq/compound"
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }

    messages = []
    sys_prompt = system_instruction or GROQ_SYSTEM_INSTRUCTION
    messages.append({"role": "system", "content": sys_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": groq_model,
        "messages": messages,
        "temperature": 0.6
    }

    try:
        logger.info(f"Invoking Groq Cloud LPU Engine model '{groq_model}' for study material enrichment...")
        res = requests.post(url, json=payload, headers=headers, timeout=30)
        if res.status_code == 200:
            data = res.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                content = choices[0]["message"].get("content", "").strip()
                logger.info(f"Successfully received creative insights from Groq Cloud ({groq_model}).")
                return content
        else:
            logger.warning(f"Groq Cloud API response error ({res.status_code}): {res.text}")
    except Exception as e:
        logger.warning(f"Failed to communicate with Groq Cloud API: {e}")

    return None
