import os
import tempfile
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class STTError(Exception):
    """Exception raised for Speech-to-Text failures."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class BaseSTTProvider:
    def transcribe(self, audio_bytes: bytes) -> str:
        """Transcribes raw audio bytes (webm/mp3/wav) into clean text."""
        raise NotImplementedError

class MockSTTProvider(BaseSTTProvider):
    """
    Mock STT Provider returning a fixed placeholder transcript string.
    Fast, zero cost, no heavy local Whisper model dependency.
    """
    def transcribe(self, audio_bytes: bytes) -> str:
        logger.info("MockSTTProvider transcribing audio bytes...")
        return "Gradient descent updates parameters by moving opposite to the cost function gradient."

class WhisperSTTProvider(BaseSTTProvider):
    """
    Production Whisper STT Provider lazily loading OpenAI Whisper model and transcribing audio bytes.
    Injects FFmpeg binary path into OS PATH for Whisper subprocess calls.
    """
    def __init__(self):
        self._model = None

    def _get_model(self):
        if self._model is None:
            import imageio_ffmpeg
            ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
            path_env = os.environ.get("PATH", "")
            if ffmpeg_dir not in path_env:
                os.environ["PATH"] = f"{ffmpeg_dir}{os.pathsep}{path_env}"

            try:
                import whisper
                logger.info(f"Loading Whisper model '{settings.WHISPER_MODEL}'...")
                self._model = whisper.load_model(settings.WHISPER_MODEL)
            except Exception as e:
                logger.error(f"Failed to load Whisper STT model: {e}")
                raise STTError(f"Whisper STT initialization error: {str(e)}", status_code=500)
        return self._model

    def transcribe(self, audio_bytes: bytes) -> str:
        model = self._get_model()

        with tempfile.NamedTemporaryFile("wb", delete=False, suffix=".webm") as tmp_audio:
            tmp_audio_path = tmp_audio.name
            tmp_audio.write(audio_bytes)

        try:
            result = model.transcribe(tmp_audio_path)
            transcript = result.get("text", "").strip()
            return transcript if transcript else "Could not clearly understand the audio."
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            raise STTError(f"Speech transcription failed: {str(e)}")
        finally:
            if os.path.exists(tmp_audio_path):
                os.remove(tmp_audio_path)

def get_stt_provider() -> BaseSTTProvider:
    """Factory returning active STT Provider based on settings.STT_PROVIDER."""
    if settings.STT_PROVIDER == "whisper":
        return WhisperSTTProvider()
    return MockSTTProvider()
