import os
import base64
import math
import logging
import requests
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class TTSError(Exception):
    """Custom exception raised for TTS synthesis failures."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class BaseTTSProvider:
    def synthesize(self, text: str, language: str = "English") -> Dict[str, Any]:
        """
        Synthesizes text into audio.
        Returns dict with keys: 'audioBytes' (bytes), 'format' ('mp3' or 'wav').
        """
        raise NotImplementedError

class MockTTSProvider(BaseTTSProvider):
    """
    Mock TTS Provider that programmatically generates valid, playable silent MP3 bytes.
    Calculates clip length based on sentence / character length (~14 characters per second of speech).
    """
    def synthesize(self, text: str, language: str = "English") -> Dict[str, Any]:
        char_count = len(text.strip())
        target_seconds = max(2.5, min(15.0, char_count / 14.0))
        
        # 1 frame = 1152 samples at 44100 Hz = 0.026122 seconds
        frame_duration = 1152.0 / 44100.0
        num_frames = max(40, math.ceil(target_seconds / frame_duration))
        
        # Standard MPEG-1 Layer III 128kbps 44.1kHz frame (417 bytes total)
        frame_header = b'\xff\xfb\x90\x64'
        frame_payload = b'\x00' * 413
        single_frame = frame_header + frame_payload
        
        mp3_bytes = single_frame * num_frames
        return {
            "audioBytes": mp3_bytes,
            "format": "mp3"
        }

class ElevenLabsTTSProvider(BaseTTSProvider):
    """
    Production TTS Provider invoking ElevenLabs REST API.
    """
    def synthesize(self, text: str, language: str = "English") -> Dict[str, Any]:
        api_key = settings.ELEVENLABS_API_KEY or os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise TTSError("ELEVENLABS_API_KEY is not configured in backend settings.", status_code=500)
        if not settings.ELEVENLABS_VOICE_ID:
            raise TTSError("ELEVENLABS_VOICE_ID is not configured in backend settings.", status_code=500)

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        payload = {
            "text": text,
            "model_id": settings.ELEVENLABS_MODEL,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=30)
            if res.status_code != 200:
                logger.error(f"ElevenLabs TTS API error ({res.status_code}): {res.text}")
                raise TTSError(f"ElevenLabs service returned error ({res.status_code}): {res.text}", status_code=502)
            
            return {
                "audioBytes": res.content,
                "format": "mp3"
            }
        except TTSError:
            raise
        except Exception as e:
            logger.error(f"ElevenLabs request exception: {e}")
            raise TTSError(f"Failed to communicate with ElevenLabs TTS service: {str(e)}", status_code=502)

class SarvamTTSProvider(BaseTTSProvider):
    """
    Production TTS Provider invoking Sarvam AI REST API (https://api.sarvam.ai/text-to-speech).
    Supports 11 Indian languages and high-quality voice synthesis.
    """
    def synthesize(self, text: str, language: str = "English") -> Dict[str, Any]:
        api_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY")
        if not api_key:
            raise TTSError(
                "SARVAM_API_KEY is not configured in backend settings. Please add SARVAM_API_KEY to your .env file.",
                status_code=500
            )

        lang_lower = (language or "").lower()
        language_code = "en-IN"
        if "hindi" in lang_lower or "hi" in lang_lower:
            language_code = "hi-IN"
        elif "bengali" in lang_lower or "bn" in lang_lower:
            language_code = "bn-IN"
        elif "kannada" in lang_lower or "kn" in lang_lower:
            language_code = "kn-IN"
        elif "malayalam" in lang_lower or "ml" in lang_lower:
            language_code = "ml-IN"
        elif "marathi" in lang_lower or "mr" in lang_lower:
            language_code = "mr-IN"
        elif "odia" in lang_lower or "od" in lang_lower:
            language_code = "od-IN"
        elif "punjabi" in lang_lower or "pa" in lang_lower:
            language_code = "pa-IN"
        elif "tamil" in lang_lower or "ta" in lang_lower:
            language_code = "ta-IN"
        elif "telugu" in lang_lower or "te" in lang_lower:
            language_code = "te-IN"
        elif "gujarati" in lang_lower or "gu" in lang_lower:
            language_code = "gu-IN"

        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": [text],
            "target_language_code": language_code,
            "speaker": settings.SARVAM_TTS_SPEAKER,
            "model": settings.SARVAM_TTS_MODEL,
            "enable_preprocessing": True
        }

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=30)
            if res.status_code != 200:
                logger.error(f"Sarvam AI TTS API error ({res.status_code}): {res.text}")
                raise TTSError(f"Sarvam AI service returned error ({res.status_code}): {res.text}", status_code=502)
            
            data = res.json()
            audios = data.get("audios", [])
            if not audios or not isinstance(audios, list):
                logger.error(f"Sarvam AI TTS API returned empty audios array: {data}")
                raise TTSError("Sarvam AI TTS response missing audio payload.", status_code=502)

            base64_audio = audios[0]
            audio_bytes = base64.b64decode(base64_audio)
            
            return {
                "audioBytes": audio_bytes,
                "format": "wav"
            }
        except TTSError:
            raise
        except Exception as e:
            logger.error(f"Sarvam AI request exception: {e}")
            raise TTSError(f"Failed to communicate with Sarvam AI TTS service: {str(e)}", status_code=502)

def get_tts_provider() -> BaseTTSProvider:
    """
    Factory function returning active TTS Provider based on settings.TTS_PROVIDER.
    """
    api_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY")
    provider_setting = (settings.TTS_PROVIDER or "").lower()
    if provider_setting == "sarvam" or (api_key and provider_setting != "mock" and provider_setting != "elevenlabs"):
        return SarvamTTSProvider()
    if provider_setting == "elevenlabs":
        return ElevenLabsTTSProvider()
    return MockTTSProvider()
