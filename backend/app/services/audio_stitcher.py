import os
import io
import json
import wave
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
    Finds per-beat audio files {sectionId}-{i}.wav or {sectionId}-{i}.mp3,
    calculates timing offsets, and concatenates them into {sectionId}-full.mp3 using ffmpeg.
    Supports both Sarvam AI WAV audio and ElevenLabs/Mock MP3 audio clips.
    Raises NoAudioFoundError if no beat audio files exist.
    """
    if not os.path.exists(AUDIO_DIR):
        raise NoAudioFoundError(section_id)

    # 1. Discover beat audio files in index order (.wav or .mp3)
    beat_dict: Dict[int, Dict[str, Any]] = {}

    for fname in os.listdir(AUDIO_DIR):
        if not fname.startswith(f"{section_id}-"):
            continue
        if fname.endswith("-full.mp3") or fname.endswith("-full.wav"):
            continue

        ext = os.path.splitext(fname)[1].lower()
        if ext not in [".wav", ".mp3"]:
            continue

        try:
            index_str = fname[len(section_id) + 1 : -len(ext)]
            idx = int(index_str)
        except ValueError:
            continue

        fpath = os.path.join(AUDIO_DIR, fname)
        manifest_path = os.path.join(AUDIO_DIR, f"{section_id}-{idx}.json")
        dur = None

        # 1a. Try to read cached duration from manifest if available
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, "r", encoding="utf-8") as mf:
                    mdata = json.load(mf)
                    dur = float(mdata.get("durationSeconds", 0))
            except Exception:
                dur = None

        # 1b. Fallback to reading file headers directly
        if dur is None or dur <= 0:
            if ext == ".wav":
                try:
                    with wave.open(fpath, "rb") as wf:
                        frames = wf.getnframes()
                        rate = wf.getframerate()
                        dur = frames / float(rate)
                except Exception as e:
                    logger.warning(f"Wave duration parse error for {fpath}: {e}")
                    dur = 3.0
            else:
                try:
                    with open(fpath, "rb") as f:
                        audio_obj = MP3(io.BytesIO(f.read()))
                        dur = float(audio_obj.info.length)
                except Exception as e:
                    logger.warning(f"MP3 duration parse error for {fpath}: {e}")
                    dur = 3.0

        dur = round(max(0.5, float(dur)), 2)

        # If both .wav and .mp3 exist for this index, prefer .wav
        if idx not in beat_dict or ext == ".wav":
            beat_dict[idx] = {
                "fpath": fpath,
                "duration": dur,
                "ext": ext
            }

    if not beat_dict:
        raise NoAudioFoundError(section_id)

    sorted_indices = sorted(beat_dict.keys())
    beat_files = [(i, beat_dict[i]["fpath"], beat_dict[i]["duration"]) for i in sorted_indices]

    # 2. Compute timing ranges
    beat_timings: List[Dict[str, Any]] = []
    current_time = 0.0

    for idx, fpath, dur in beat_files:
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

    # 3. Concatenate using ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt", encoding="utf-8") as list_file:
        list_file_path = list_file.name
        for _, fpath, _ in beat_files:
            clean_path = fpath.replace("\\", "/").replace("'", "'\\''")
            list_file.write(f"file '{clean_path}'\n")

    try:
        # Encode to clean MP3 so both WAV clips and MP3 clips concatenate seamlessly
        cmd = [
            ffmpeg_exe,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file_path,
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            output_full_mp3
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            logger.warning(f"FFmpeg audio reencode concat failed ({res.returncode}): {res.stderr}. Trying copy concat...")
            cmd_copy = [
                ffmpeg_exe,
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", list_file_path,
                "-c", "copy",
                output_full_mp3
            ]
            subprocess.run(cmd_copy, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    finally:
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

    return {
        "audioPath": output_full_mp3,
        "totalDurationSeconds": total_duration,
        "beatTimings": beat_timings
    }
