import json
import logging
import time
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
]

TRANSIENT_ERROR_KEYWORDS = [
    "503",
    "unavailable",
    "high demand",
    "temporarily",
    "overloaded",
    "429",
    "quota",
    "rate limit",
    "rate_limit",
    "resource_exhausted",
    "resource exhausted",
    "404",
    "not found",
    "not available",
    "no longer available",
    "500",
    "502",
    "504",
    "internal error",
    "timeout",
    "deadline",
]


class LLMError(Exception):
    """Custom exception raised for LLM generation or parsing failures."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

def generate_json_response(prompt: str, system_instruction: str = "") -> dict:
    """
    Invokes Google Gemini with JSON mode enabled and parses the output as a dict.
    Tries settings.GEMINI_MODEL first, followed by fallbacks if a transient error
    (503 High Demand, 429 Rate Limit, 404 Model Migration, Timeout) occurs.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is missing in backend settings.")
        raise LLMError("GEMINI_API_KEY is not configured on the server.", status_code=500)

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        raise LLMError("Failed to initialize Gemini client.", status_code=500)

    # Ensure prioritized order: configured model first, followed by unique fallbacks
    candidate_models = [settings.GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != settings.GEMINI_MODEL]
    last_exception = None

    for model_name in candidate_models:
        config_kwargs = {
            "response_mime_type": "application/json",
            "temperature": 0.3,
        }
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction

        config = types.GenerateContentConfig(**config_kwargs)

        try:
            logger.info(f"Invoking Gemini model '{model_name}'...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            
            if not response or not response.text:
                raise LLMError("Empty response returned by LLM model.")

            text_content = response.text.strip()
            if text_content.startswith("```json"):
                text_content = text_content[7:]
            if text_content.startswith("```"):
                text_content = text_content[3:]
            if text_content.endswith("```"):
                text_content = text_content[:-3]
            text_content = text_content.strip()

            return json.loads(text_content)

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM response as JSON from model '{model_name}': {e}. Trying fallback model...")
            last_exception = LLMError(f"LLM returned invalid JSON output: {str(e)}")
            continue
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"Gemini API error with model '{model_name}': {err_msg}")
            last_exception = LLMError(f"Gemini service error: {err_msg}")
            # If 503 high demand, 429 rate limit, 404 model error, or transient failure, rotate to next candidate model
            if any(k in err_msg.lower() for k in TRANSIENT_ERROR_KEYWORDS):
                logger.info(f"Transient error with model '{model_name}'. Rotating to next candidate model...")
                time.sleep(1.5)
                continue
            else:
                break

    if last_exception:
        raise last_exception
    raise LLMError("Failed to generate response from all candidate Gemini models.")
