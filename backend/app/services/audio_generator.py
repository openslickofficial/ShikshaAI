import os
import io
import json
import logging
from typing import List, Dict, Any
from mutagen.mp3 import MP3

from app.core.config import settings
from app.services.tts_provider import get_tts_provider
from app.services.character_budget import reserve_budget, record_spend

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
AUDIO_DIR = os.path.join(DATA_DIR, "audio")

def generate_section_audio(section_id: str, beats: List[str], language: str = "English") -> Dict[str, Any]:
    """
    Synthesizes audio files for all narration beats in a section.
    Includes smart disk caching: if the exact beat text and language have already been synthesized,
    the stored audio file is reused without deducting budget or re-calling TTS APIs.
    """
    if not beats:
        return {"sectionId": section_id, "beats": [], "totalCharactersUsed": 0}

    os.makedirs(AUDIO_DIR, exist_ok=True)
    provider = get_tts_provider()
    api_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY")
    is_real_provider = (settings.TTS_PROVIDER in ["elevenlabs", "sarvam"]) or bool(api_key)

    beat_results: List[Dict[str, Any]] = []
    uncached_chars_to_synthesize = 0
    beats_to_synthesize = []

    # 1. First pass: Check disk cache for each beat clip
    for idx, beat_text in enumerate(beats):
        text_clean = beat_text.strip()
        if not text_clean:
            text_clean = "..."

        manifest_path = os.path.join(AUDIO_DIR, f"{section_id}-{idx}.json")
        is_cached = False
        cached_data = None

        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    manifest = json.load(f)
                
                audio_format = manifest.get("audio_format", "wav")
                audio_filename = f"{section_id}-{idx}.{audio_format}"
                audio_path = os.path.join(AUDIO_DIR, audio_filename)

                # Validate cached text, language and audio file existence
                if (
                    manifest.get("text") == text_clean and
                    manifest.get("language", "English").lower() == (language or "English").lower() and
                    os.path.exists(audio_path)
                ):
                    is_cached = True
                    cached_data = {
                        "beatIndex": idx,
                        "audioUrl": f"/api/audio/files/{audio_filename}",
                        "durationSeconds": manifest.get("durationSeconds", 3.0),
                        "charactersUsed": len(text_clean),
                        "fromCache": True
                    }
            except Exception as e:
                logger.warning(f"Error reading cache manifest {manifest_path}: {e}")

        if is_cached and cached_data:
            beat_results.append((idx, cached_data))
        else:
            uncached_chars_to_synthesize += len(text_clean)
            beats_to_synthesize.append((idx, text_clean))

    # 2. Reserve budget up front only for UNCACHED character count
    if is_real_provider and uncached_chars_to_synthesize > 0:
        reserve_budget(uncached_chars_to_synthesize)

    # 3. Synthesize any uncached beats
    for idx, text_clean in beats_to_synthesize:
        synth_res = provider.synthesize(text_clean, language=language)
        audio_bytes = synth_res["audioBytes"]
        audio_format = synth_res.get("format", "wav")
        
        file_name = f"{section_id}-{idx}.{audio_format}"
        file_path = os.path.join(AUDIO_DIR, file_name)
        
        with open(file_path, "wb") as f:
            f.write(audio_bytes)

        # Calculate duration
        try:
            if audio_format == "wav":
                import wave
                with wave.open(file_path, "rb") as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    duration = frames / float(rate)
            else:
                mp3_info = MP3(io.BytesIO(audio_bytes))
                duration = float(mp3_info.info.length)
        except Exception as e:
            logger.warning(f"Duration parse error for {file_name}: {e}. Using fallback timing.")
            duration = max(2.5, len(text_clean) / 14.0)

        duration = round(duration, 2)

        # Write manifest file for persistence & future re-request caching
        manifest_path = os.path.join(AUDIO_DIR, f"{section_id}-{idx}.json")
        manifest_data = {
            "sectionId": section_id,
            "beatIndex": idx,
            "text": text_clean,
            "language": language or "English",
            "audio_format": audio_format,
            "durationSeconds": duration
        }
        try:
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest_data, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to write manifest file {manifest_path}: {e}")

        beat_results.append((idx, {
            "beatIndex": idx,
            "audioUrl": f"/api/audio/files/{file_name}",
            "durationSeconds": duration,
            "charactersUsed": len(text_clean),
            "fromCache": False
        }))

    # 4. Record spend only for uncached characters
    if is_real_provider and uncached_chars_to_synthesize > 0:
        record_spend(uncached_chars_to_synthesize)

    # Sort results by beat index
    beat_results.sort(key=lambda item: item[0])
    final_beats = [item[1] for item in beat_results]

    return {
        "sectionId": section_id,
        "beats": final_beats,
        "totalCharactersUsed": uncached_chars_to_synthesize if is_real_provider else 0
    }
