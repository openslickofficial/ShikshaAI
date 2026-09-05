import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Literal, Optional

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:5174"
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Groq Cloud Ultra-Fast LPU Engine Settings (Gemini + Groq Hybrid LLM Ensemble)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "groq/compound"

    # TTS Settings (Phase 7)
    TTS_PROVIDER: Literal["mock", "elevenlabs", "sarvam"] = "sarvam"
    SARVAM_API_KEY: Optional[str] = None
    SARVAM_TTS_MODEL: str = "bulbul:v3"
    SARVAM_TTS_SPEAKER: str = "ritu"
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: Optional[str] = None
    ELEVENLABS_MODEL: str = "eleven_multilingual_v2"
    MAX_TTS_CHARACTERS: int = 9000

    # Avatar & Video Settings (Phase 8)
    AVATAR_PROVIDER: Literal["mock", "did"] = "mock"
    DID_API_KEY: Optional[str] = None
    DID_PRESENTER_ID: Optional[str] = None
    MAX_AVATAR_SECONDS: int = 150
    PUBLIC_BASE_URL: Optional[str] = None

    # Speech-to-Text Settings (Phase 9)
    STT_PROVIDER: Literal["mock", "whisper"] = "mock"
    WHISPER_MODEL: str = "base"

    # Database Persistence Settings (Phase 10 & 13)
    DATABASE_PATH: str = "data/app.db"
    DATABASE_URL: Optional[str] = None

    # Upstash Redis Rate Limiting Settings
    UPSTASH_REDIS_REST_URL: Optional[str] = None
    UPSTASH_REDIS_REST_TOKEN: Optional[str] = None

    # Supabase Auth Settings (Phase 14 & Security Fix)
    SUPABASE_URL: str = ""
    SUPABASE_JWT_AUDIENCE: str = "authenticated"
    ALLOW_UNVERIFIED_AUTH_FALLBACK: bool = False

    model_config = SettingsConfigDict(env_file=env_path, env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
