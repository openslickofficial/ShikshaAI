import logging
import jwt
from jwt import PyJWKClient
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class AuthError(Exception):
    def __init__(self, detail: str = "Invalid or expired authentication token."):
        self.detail = detail
        self.status_code = 401

# Validate authentication configuration at startup
def validate_auth_config():
    if not (settings.SUPABASE_URL and settings.SUPABASE_URL.strip()):
        if not settings.ALLOW_UNVERIFIED_AUTH_FALLBACK:
            raise ValueError(
                "CRITICAL CONFIG ERROR: SUPABASE_URL is empty and ALLOW_UNVERIFIED_AUTH_FALLBACK is False. "
                "Refusing to start backend server without authentication configuration."
            )

validate_auth_config()

# Cached PyJWKClient instance
_jwk_client: Optional[PyJWKClient] = None

def get_jwk_client() -> Optional[PyJWKClient]:
    global _jwk_client
    if not settings.SUPABASE_URL or not settings.SUPABASE_URL.strip():
        return None
    if _jwk_client is None:
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url)
    return _jwk_client

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Supabase JWT token against the project's JWKS endpoint using PyJWT.
    Returns a dict containing `sub` (the user UUID) and optional `displayName`.
    """
    if not token or not token.strip():
        raise AuthError("Missing authorization token.")

    token = token.strip()

    # 1. Fallback for unconfigured SUPABASE_URL in local dev (explicit opt-in only)
    if not settings.SUPABASE_URL or not settings.SUPABASE_URL.strip():
        if settings.ALLOW_UNVERIFIED_AUTH_FALLBACK:
            # NOTE: This unverified fallback path is for local development without a live Supabase project only.
            # It is unsafe in any deployed environment, and ALLOW_UNVERIFIED_AUTH_FALLBACK must never be set on Render.
            try:
                unverified_payload = jwt.decode(token, options={"verify_signature": False})
                sub = unverified_payload.get("sub")
                if not sub:
                    raise AuthError("Token payload missing 'sub' claim.")
                user_metadata = unverified_payload.get("user_metadata") or {}
                display_name = (
                    user_metadata.get("display_name")
                    or user_metadata.get("full_name")
                    or unverified_payload.get("email", "").split("@")[0]
                    or "Learner"
                )
                return {"sub": str(sub), "displayName": display_name}
            except AuthError:
                raise
            except Exception as e:
                logger.warning(f"Unverified token parse failed: {e}")
                raise AuthError("Invalid or expired authentication token.")
        else:
            raise AuthError("Supabase Auth client not configured.")

    # 2. Strict RS256 JWKS verification when SUPABASE_URL is configured
    try:
        jwk_client = get_jwk_client()
        if not jwk_client:
            raise AuthError("Supabase Auth client not configured.")

        signing_key = jwk_client.get_signing_key_from_jwt(token)
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        issuer = f"{supabase_url}/auth/v1"

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256", "HS256"],
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=issuer,
            leeway=60,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": True,
            },
        )

        sub = payload.get("sub")
        if not sub:
            raise AuthError("Token payload missing 'sub' claim.")

        user_metadata = payload.get("user_metadata") or {}
        display_name = user_metadata.get("display_name") or user_metadata.get("full_name")

        return {
            "sub": str(sub),
            "displayName": display_name,
        }

    except jwt.PyJWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise AuthError("Invalid or expired authentication token.")
    except Exception as e:
        logger.error(f"Unexpected error during auth token verification: {e}")
        raise AuthError("Authentication verification error.")
