import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.deps import get_current_learner
from app.models.db_models import LearnerProfile
from app.services.audio_stitcher import stitch_section_audio, NoAudioFoundError
from app.services.avatar_provider import get_avatar_provider, AvatarError
from app.services.video_budget import reserve_video_budget, record_video_spend, get_video_budget_status, BudgetExceededError
from app.services.video_composer import compose_section_video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["video"])

class BeatTimingItem(BaseModel):
    beatIndex: int
    startSeconds: float
    endSeconds: float

class SectionVideoRequest(BaseModel):
    sectionId: str
    onScreenHeadline: str = Field(description="Headline caption to burn into bottom of avatar video.")

class SectionVideoResponse(BaseModel):
    sectionId: str
    videoUrl: str
    durationSeconds: float
    beatTimings: List[BeatTimingItem]

class VideoBudgetStatusResponse(BaseModel):
    used: float
    limit: float
    remaining: float
    provider: str

@router.post("/section", response_model=SectionVideoResponse)
def synthesize_section_video(
    request: SectionVideoRequest,
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Synthesizes and composes a talking avatar video for a section's stitched narration audio.
    Requires section audio clips from Phase 7 to already exist.
    """
    # 1. Stitch Audio
    try:
        stitched = stitch_section_audio(request.sectionId)
    except NoAudioFoundError as na:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(na)
        )
    except Exception as e:
        logger.error(f"Error stitching audio for section {request.sectionId}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stitch section audio due to an internal service error."
        )

    duration = stitched["totalDurationSeconds"]
    is_real_provider = (settings.AVATAR_PROVIDER == "did")

    # 2. Reserve Budget upfront if using real provider
    if is_real_provider:
        try:
            reserve_video_budget(duration)
        except BudgetExceededError as be:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=str(be)
            )

    # 3. Avatar Synthesis & Composition
    try:
        provider = get_avatar_provider()
        avatar_res = provider.synthesize_avatar(stitched["audioPath"], duration)
        video_url = compose_section_video(request.sectionId, avatar_res["videoBytes"], request.onScreenHeadline)

        if is_real_provider:
            record_video_spend(duration)

        return {
            "sectionId": request.sectionId,
            "videoUrl": video_url,
            "durationSeconds": duration,
            "beatTimings": stitched["beatTimings"]
        }
    except AvatarError as ae:
        logger.error(f"Avatar provider error in /api/video/section: {ae.message}")
        raise HTTPException(
            status_code=ae.status_code,
            detail=ae.message
        )
    except Exception as e:
        logger.error(f"Unexpected error composing avatar video: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to compose section avatar video due to an internal service error."
        )

@router.get("/budget", response_model=VideoBudgetStatusResponse)
def get_video_budget(
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Returns avatar video budget usage status and active provider name.
    """
    return get_video_budget_status()

