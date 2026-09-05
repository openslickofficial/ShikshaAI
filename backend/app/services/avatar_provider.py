import os
import time
import base64
import tempfile
import subprocess
import logging
import requests
from typing import Dict, Any
import imageio_ffmpeg
from app.core.config import settings

logger = logging.getLogger(__name__)

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
PLACEHOLDER_PNG = os.path.join(ASSETS_DIR, "avatar_placeholder.png")

class AvatarError(Exception):
    """Custom exception raised for avatar synthesis failures."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class BaseAvatarProvider:
    def synthesize_avatar(self, audio_path: str, duration_seconds: float) -> Dict[str, Any]:
        """
        Synthesizes an MP4 video clip combining talking avatar visuals with narration audio.
        Returns dict with keys: 'videoBytes' (bytes), 'format' ('mp4').
        """
        raise NotImplementedError

class MockAvatarProvider(BaseAvatarProvider):
    """
    Fallback Avatar Provider generating animated video with live gold audio waveform overlay over teacher avatar canvas using FFmpeg.
    Zero character / video budget cost.
    """
    def synthesize_avatar(self, audio_path: str, duration_seconds: float) -> Dict[str, Any]:
        if not os.path.exists(PLACEHOLDER_PNG):
            from app.assets.create_placeholder import generate_avatar_png
            generate_avatar_png(PLACEHOLDER_PNG)

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        with tempfile.NamedTemporaryFile("wb", delete=False, suffix=".mp4") as tmp_mp4:
            tmp_mp4_path = tmp_mp4.name

        try:
            cmd = [
                ffmpeg_exe,
                "-y",
                "-loop", "1",
                "-i", PLACEHOLDER_PNG,
                "-i", audio_path,
                "-filter_complex", "[1:a]showwaves=s=360x60:mode=line:colors=0xf59e0b[wave];[0:v][wave]overlay=x=20:y=320[v]",
                "-map", "[v]",
                "-map", "1:a",
                "-c:v", "libx264",
                "-tune", "stillimage",
                "-c:a", "aac",
                "-b:a", "128k",
                "-pix_fmt", "yuv420p",
                "-shortest",
                tmp_mp4_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                logger.warning(f"Animated FFmpeg video generation error ({res.returncode}): {res.stderr}. Trying fallback static stream.")
                cmd_fallback = [
                    ffmpeg_exe,
                    "-y",
                    "-loop", "1",
                    "-i", PLACEHOLDER_PNG,
                    "-i", audio_path,
                    "-c:v", "libx264",
                    "-tune", "stillimage",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-pix_fmt", "yuv420p",
                    "-shortest",
                    tmp_mp4_path
                ]
                res_fallback = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                if res_fallback.returncode != 0:
                    raise AvatarError(f"FFmpeg failed to compose avatar video: {res_fallback.stderr}")

            with open(tmp_mp4_path, "rb") as f:
                video_bytes = f.read()

            return {
                "videoBytes": video_bytes,
                "format": "mp4"
            }
        finally:
            if os.path.exists(tmp_mp4_path):
                os.remove(tmp_mp4_path)

class DIDAvatarProvider(BaseAvatarProvider):
    """
    Production D-ID Avatar Provider invoking D-ID REST API (https://api.d-id.com/talks) and polling until render completes.
    Generates real AI face lip-synced presenter video.
    """
    def synthesize_avatar(self, audio_path: str, duration_seconds: float) -> Dict[str, Any]:
        api_key = settings.DID_API_KEY or os.getenv("DID_API_KEY")
        if not api_key:
            raise AvatarError(
                "DID_API_KEY is not configured in backend settings. Please set DID_API_KEY in your .env file to generate real D-ID face presenter video.",
                status_code=500
            )

        public_base = settings.PUBLIC_BASE_URL or os.getenv("PUBLIC_BASE_URL") or "http://localhost:8000"
        if "your-ngrok-subdomain" in public_base:
            public_base = "http://localhost:8000"

        filename = os.path.basename(audio_path)
        public_audio_url = f"{public_base.rstrip('/')}/api/audio/files/{filename}"

        # Format Basic Authorization header properly
        if api_key.startswith("Basic "):
            auth_header = api_key
        elif ":" in api_key:
            b64_key = base64.b64encode(api_key.encode("utf-8")).decode("utf-8")
            auth_header = f"Basic {b64_key}"
        else:
            auth_header = f"Basic {api_key}"

        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "script": {
                "type": "audio",
                "audio_url": public_audio_url
            },
            "config": {
                "fluent": "false",
                "pad_audio": "0.0"
            }
        }
        if settings.DID_PRESENTER_ID:
            payload["presenter_id"] = settings.DID_PRESENTER_ID

        logger.info(f"Calling D-ID API Endpoint https://api.d-id.com/talks with audio_url: {public_audio_url}")

        # 1. Create Talk
        try:
            res = requests.post("https://api.d-id.com/talks", json=payload, headers=headers, timeout=30)
            if res.status_code not in (200, 201):
                logger.error(f"D-ID API talk creation error ({res.status_code}): {res.text}")
                raise AvatarError(f"D-ID service returned error ({res.status_code}): {res.text}", status_code=502)

            talk_data = res.json()
            talk_id = talk_data.get("id")
            if not talk_id:
                raise AvatarError("D-ID response missing talk ID.", status_code=502)
        except AvatarError:
            raise
        except Exception as e:
            raise AvatarError(f"Failed to communicate with D-ID API: {str(e)}", status_code=502)

        # 2. Poll until talk render is done (max 120s timeout)
        poll_url = f"https://api.d-id.com/talks/{talk_id}"
        max_attempts = 40
        for _ in range(max_attempts):
            time.sleep(3)
            try:
                poll_res = requests.get(poll_url, headers=headers, timeout=20)
                if poll_res.status_code == 200:
                    status_data = poll_res.json()
                    current_status = status_data.get("status")
                    if current_status == "done":
                        result_url = status_data.get("result_url")
                        video_res = requests.get(result_url, timeout=30)
                        if video_res.status_code == 200:
                            return {
                                "videoBytes": video_res.content,
                                "format": "mp4"
                            }
                        raise AvatarError(f"Failed to download rendered video from D-ID: status {video_res.status_code}")
                    elif current_status in ("error", "rejected"):
                        raise AvatarError(f"D-ID talk rendering failed with status '{current_status}'.")
            except AvatarError:
                raise
            except Exception as e:
                logger.warning(f"D-ID polling attempt exception: {e}")

        raise AvatarError("D-ID talk synthesis timed out after 120 seconds.")

def get_avatar_provider() -> BaseAvatarProvider:
    """
    Factory function returning active Avatar Provider based on settings.AVATAR_PROVIDER or DID_API_KEY.
    """
    api_key = settings.DID_API_KEY or os.getenv("DID_API_KEY")
    provider_setting = (settings.AVATAR_PROVIDER or "").lower()

    if provider_setting == "did" or (api_key and provider_setting != "mock"):
        return DIDAvatarProvider()

    return MockAvatarProvider()
