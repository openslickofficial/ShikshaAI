import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from upstash_redis import Redis
from upstash_ratelimit import Ratelimit, SlidingWindow

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global cached Ratelimit instance
_ratelimit_instance: Optional[Ratelimit] = None

def get_rate_limiter() -> Optional[Ratelimit]:
    """
    Returns an upstash_ratelimit.Ratelimit instance if Upstash credentials are configured.
    If UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN are unset/empty, returns None
    to serve as a no-op fallback for safe local development without an Upstash account.
    """
    global _ratelimit_instance
    if _ratelimit_instance is not None:
        return _ratelimit_instance

    url = settings.UPSTASH_REDIS_REST_URL
    token = settings.UPSTASH_REDIS_REST_TOKEN

    if url and url.strip() and token and token.strip():
        try:
            redis = Redis(url=url.strip(), token=token.strip())
            _ratelimit_instance = Ratelimit(
                redis=redis,
                limiter=SlidingWindow(max_requests=10, window=1, unit="h"),
                prefix="ai_teacher_ratelimit",
            )
            return _ratelimit_instance
        except Exception as e:
            logger.warning(f"Failed to initialize Upstash Redis rate limiter: {e}")
            return None
    return None

def check_rate_limit(request: Request) -> None:
    """
    FastAPI dependency enforcing HTTP-based sliding window rate limits via Upstash Redis.
    Limits clients to 10 requests per hour across expensive AI endpoints by IP address.
    Survives Render free-tier idle spin-downs because state is persisted in Upstash.
    If Upstash credentials are unset, acts as a safe no-op pass-through for local dev.
    """
    limiter = get_rate_limiter()
    if limiter is None:
        # Safe local development default (no-op pass-through)
        return

    # Extract client IP address (supporting reverse proxy headers like X-Forwarded-For)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    try:
        response = limiter.limit(client_ip)
        if not response.allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Maximum 10 requests per hour on AI generation endpoints."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Upstash Redis rate limit check error (allowing request): {e}")
