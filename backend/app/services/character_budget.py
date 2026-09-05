import os
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
USAGE_FILE_PATH = os.path.join(DATA_DIR, "tts_usage.json")

class BudgetExceededError(Exception):
    """Exception raised when an audio synthesis request exceeds MAX_TTS_CHARACTERS."""
    def __init__(self, requested: int, used: int, limit: int):
        self.requested = requested
        self.used = used
        self.limit = limit
        self.remaining = max(0, limit - used)
        super().__init__(
            f"Character budget exceeded: Requesting {requested} chars, but only {self.remaining} remaining out of {limit} limit."
        )

def _read_usage_file() -> int:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USAGE_FILE_PATH):
        return 0
    try:
        with open(USAGE_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return int(data.get("charactersUsed", 0))
    except Exception as e:
        logger.warning(f"Error reading tts_usage.json: {e}")
        return 0

def _write_usage_file(used_count: int):
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(USAGE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump({"charactersUsed": used_count}, f, indent=2)
    except Exception as e:
        logger.error(f"Error writing to tts_usage.json: {e}")

def reserve_budget(char_count: int):
    """
    Checks if char_count can be accommodated within remaining MAX_TTS_CHARACTERS.
    Raises BudgetExceededError if limit is reached.
    """
    current_used = _read_usage_file()
    limit = settings.MAX_TTS_CHARACTERS
    if current_used + char_count > limit:
        raise BudgetExceededError(requested=char_count, used=current_used, limit=limit)

def record_spend(char_count: int) -> int:
    """
    Records character spend into persisted tts_usage.json file.
    Returns new total character count used.
    """
    current_used = _read_usage_file()
    new_used = current_used + char_count
    _write_usage_file(new_used)
    return new_used

def get_budget_status() -> dict:
    """
    Returns current character budget status object.
    """
    used = _read_usage_file()
    limit = settings.MAX_TTS_CHARACTERS
    provider = settings.TTS_PROVIDER
    if settings.SARVAM_API_KEY and provider not in ["mock", "elevenlabs"]:
        provider = "sarvam"
    remaining = max(0, limit - used)

    return {
        "used": used,
        "limit": limit,
        "remaining": remaining,
        "provider": provider
    }
