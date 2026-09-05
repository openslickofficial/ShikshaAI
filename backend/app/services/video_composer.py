import os
import tempfile
import subprocess
import logging
import imageio_ffmpeg

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
VIDEO_DIR = os.path.join(DATA_DIR, "video")

def compose_section_video(section_id: str, avatar_video_bytes: bytes, headline: str) -> str:
    """
    Burns the single-line on-screen headline caption onto the bottom of the avatar video frame
    using FFmpeg drawtext overlay and writes final MP4 to backend/data/video/{sectionId}.mp4.
    Returns relative video URL string '/api/video/files/{sectionId}.mp4'.
    """
    os.makedirs(VIDEO_DIR, exist_ok=True)
    final_output_path = os.path.join(VIDEO_DIR, f"{section_id}.mp4")

    # Clean headline text for drawtext
    clean_headline = headline.replace("'", "").replace(":", "-").strip()
    if not clean_headline:
        clean_headline = "Shiksha AI Lesson"

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    with tempfile.NamedTemporaryFile("wb", delete=False, suffix=".mp4") as tmp_in:
        tmp_in_path = tmp_in.name
        tmp_in.write(avatar_video_bytes)

    try:
        # Drawtext filter for bottom caption bar
        drawtext_filter = (
            f"drawtext=text='{clean_headline}':"
            f"fontcolor=white:fontsize=18:x=(w-text_w)/2:y=h-45:"
            f"box=1:boxcolor=black@0.6:boxborderw=6"
        )

        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", tmp_in_path,
            "-vf", drawtext_filter,
            "-c:v", "libx264",
            "-c:a", "copy",
            final_output_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if res.returncode != 0:
            logger.warning(f"FFmpeg drawtext caption failed ({res.returncode}): {res.stderr}. Saving clean avatar video.")
            with open(final_output_path, "wb") as f_out:
                f_out.write(avatar_video_bytes)
    except Exception as e:
        logger.warning(f"Video composition exception: {e}. Writing clean avatar video.")
        with open(final_output_path, "wb") as f_out:
            f_out.write(avatar_video_bytes)
    finally:
        if os.path.exists(tmp_in_path):
            os.remove(tmp_in_path)

    return f"/api/video/files/{section_id}.mp4"
