import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db import create_db_and_tables
from app.routers import lessons, materials, audio, video, interaction, sessions

app = FastAPI(
    title="Shiksha AI API",
    description="Backend service for Shiksha AI interactive lesson generation, RAG ingestion, TTS narration, avatar video composition, interactive delivery checkpoints, and database persistence.",
    version="1.0.0",
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Audio & Video Files Directories
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

AUDIO_DIR = os.path.join(DATA_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/api/audio/files", StaticFiles(directory=AUDIO_DIR), name="audio_files")

VIDEO_DIR = os.path.join(DATA_DIR, "video")
os.makedirs(VIDEO_DIR, exist_ok=True)
app.mount("/api/video/files", StaticFiles(directory=VIDEO_DIR), name="video_files")

# Register Routers
app.include_router(lessons.router)
app.include_router(materials.router)
app.include_router(audio.router)
app.include_router(video.router)
app.include_router(interaction.router)
app.include_router(sessions.router)

@app.get("/")
def read_root():
    return {"message": "Shiksha AI FastAPI Service Running", "status": "online"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Shiksha AI API"}
