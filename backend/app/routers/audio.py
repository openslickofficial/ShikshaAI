import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps import get_current_learner
from app.models.db_models import LearnerProfile
from app.services.audio_generator import generate_section_audio
from app.services.character_budget import get_budget_status, BudgetExceededError
from app.services.tts_provider import TTSError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audio", tags=["audio"])

class BeatAudioResult(BaseModel):
    beatIndex: int
    audioUrl: str
    durationSeconds: float
    charactersUsed: int

class SectionAudioRequest(BaseModel):
    sectionId: str
    beats: List[str] = Field(description="List of speakable narration beats to synthesize into audio clips.")
    language: Optional[str] = Field(default="English", description="Target language (e.g. English, Hindi, Bengali, Tamil, etc.)")

class SectionAudioResponse(BaseModel):
    sectionId: str
    beats: List[BeatAudioResult]
    totalCharactersUsed: int

class BudgetStatusResponse(BaseModel):
    used: int
    limit: int
    remaining: int
    provider: str

@router.post("/section", response_model=SectionAudioResponse)
def synthesize_section_audio(
    request: SectionAudioRequest,
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Synthesizes audio clips using Sarvam AI / active TTS provider and returns exact timing durations for a section's narration beats.
    Enforces character budget up front.
    """
    try:
        res = generate_section_audio(request.sectionId, request.beats, language=request.language or "English")
        return res
    except BudgetExceededError as be:
        logger.warning(f"Audio synthesis budget exceeded: {be}")
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(be)
        )
    except TTSError as te:
        logger.error(f"TTS service error in /api/audio/section: {te.message}")
        raise HTTPException(
            status_code=te.status_code,
            detail=te.message
        )
    except Exception as e:
        logger.error(f"Unexpected error in /api/audio/section: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to synthesize section audio clips due to an internal service error."
        )

@router.get("/budget", response_model=BudgetStatusResponse)
def get_character_budget(
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Returns character budget usage status and active provider name.
    """
    return get_budget_status()
