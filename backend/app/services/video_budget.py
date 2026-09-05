import os
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
USAGE_FILE_PATH = os.path.join(DATA_DIR, "video_usage.json")

class BudgetExceededError(Exception):
    """Exception raised when avatar video synthesis exceeds MAX_AVATAR_SECONDS."""
    def __init__(self, requested_seconds: float, used_seconds: float, limit_seconds: float):
        self.requested = requested_seconds
        self.used = used_seconds
        self.limit = limit_seconds
        self.remaining = max(0.0, limit_seconds - used_seconds)
        super().__init__(
            f"Avatar Video budget exceeded: Requesting {requested_seconds:.1f}s, but only {self.remaining:.1f}s remaining out of {limit_seconds:.1f}s limit."
        )

def _read_usage_file() -> float:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USAGE_FILE_PATH):
        return 0.0
    try:
        with open(USAGE_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return float(data.get("secondsUsed", 0.0))
    except Exception as e:
        logger.warning(f"Error reading video_usage.json: {e}")
        return 0.0

def _write_usage_file(used_seconds: float):
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(USAGE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump({"secondsUsed": round(used_seconds, 2)}, f, indent=2)
    except Exception as e:
        logger.error(f"Error writing to video_usage.json: {e}")

def reserve_video_budget(seconds: float):
    """
    Checks if seconds can be accommodated within remaining MAX_AVATAR_SECONDS.
    Raises BudgetExceededError if limit is exceeded.
    (Mock Avatar provider calls should NOT invoke this).
    """
    current_used = _read_usage_file()
    limit = float(settings.MAX_AVATAR_SECONDS)
    if current_used + seconds > limit:
        raise BudgetExceededError(requested_seconds=seconds, used_seconds=current_used, limit_seconds=limit)

def record_video_spend(seconds: float) -> float:
    """
    Records avatar video duration spend into persisted video_usage.json file.
    Returns new total seconds used.
    """
    current_used = _read_usage_file()
    new_used = current_used + seconds
    _write_usage_file(new_used)
    return round(new_used, 2)

def get_video_budget_status() -> dict:
    """
    Returns current avatar video budget status object.
    """
    used = _read_usage_file()
    limit = float(settings.MAX_AVATAR_SECONDS)
    provider = settings.AVATAR_PROVIDER
    remaining = max(0.0, limit - used)

    return {
        "used": round(used, 2),
        "limit": limit,
        "remaining": round(remaining, 2),
        "provider": provider
    }
