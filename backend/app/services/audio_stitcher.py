import os
import io
import tempfile
import subprocess
import logging
from typing import Dict, Any, List
import imageio_ffmpeg
from mutagen.mp3 import MP3

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
AUDIO_DIR = os.path.join(DATA_DIR, "audio")

class NoAudioFoundError(Exception):
    """Exception raised when no Phase 7 audio clips exist for a section."""
    def __init__(self, section_id: str):
        self.section_id = section_id
        super().__init__(f"No audio clips found for section '{section_id}'. Please generate audio for this section first.")

def stitch_section_audio(section_id: str) -> Dict[str, Any]:
    """
    Finds per-beat audio files {sectionId}-{i}.mp3, calculates timing offsets,
    and concatenates them into {sectionId}-full.mp3 using ffmpeg.
    Raises NoAudioFoundError if no beat audio files exist.
    """
    if not os.path.exists(AUDIO_DIR):
        raise NoAudioFoundError(section_id)

    # 1. Discover beat files in index order
    beat_files: List[tuple[int, str]] = []
    for fname in os.listdir(AUDIO_DIR):
        if fname.startswith(f"{section_id}-") and fname.endswith(".mp3") and not fname.endswith("-full.mp3"):
            try:
                index_str = fname[len(section_id) + 1 : -4]
                idx = int(index_str)
                beat_files.append((idx, os.path.join(AUDIO_DIR, fname)))
            except ValueError:
                continue

    if not beat_files:
        raise NoAudioFoundError(section_id)

    beat_files.sort(key=lambda x: x[0])

    # 2. Compute timing ranges using mutagen
    beat_timings: List[Dict[str, Any]] = []
    current_time = 0.0

    for idx, fpath in beat_files:
        try:
            with open(fpath, "rb") as f:
                audio_obj = MP3(io.BytesIO(f.read()))
                dur = float(audio_obj.info.length)
        except Exception as e:
            logger.warning(f"Error parsing duration for {fpath}: {e}")
            dur = 3.0

        start_sec = current_time
        end_sec = current_time + dur
        beat_timings.append({
            "beatIndex": idx,
            "startSeconds": round(start_sec, 2),
            "endSeconds": round(end_sec, 2)
        })
        current_time = end_sec

    total_duration = round(current_time, 2)
    output_full_mp3 = os.path.join(AUDIO_DIR, f"{section_id}-full.mp3")

    # 3. Concatenate using ffmpeg concat demuxer
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt", encoding="utf-8") as list_file:
        list_file_path = list_file.name
        for _, fpath in beat_files:
            # Escape single quotes and backslashes for ffmpeg file list
            clean_path = fpath.replace("\\", "/").replace("'", "'\\''")
            list_file.write(f"file '{clean_path}'\n")

    try:
        cmd = [
            ffmpeg_exe,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file_path,
            "-c", "copy",
            output_full_mp3
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            logger.error(f"FFmpeg audio concat failed ({res.returncode}): {res.stderr}")
            # Fallback re-encode if copy concat fails
            cmd_reencode = [
                ffmpeg_exe,
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", list_file_path,
                "-acodec", "libmp3lame",
                "-ab", "128k",
                output_full_mp3
            ]
            subprocess.run(cmd_reencode, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    finally:
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

    return {
        "audioPath": output_full_mp3,
        "totalDurationSeconds": total_duration,
        "beatTimings": beat_timings
    }
