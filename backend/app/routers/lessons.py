import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session as DBSession

from app.db import get_session
from app.deps import get_current_learner
from app.models.db_models import LearnerProfile
from app.schemas.lesson import LessonRequest, LessonPlan, PlanGenerationResponse
from app.schemas.content import ContentGenerationRequest, ContentGenerationResponse
from app.services.lesson_planner import generate_lesson_plan
from app.services.content_generator import generate_content_script
from app.services.session_repository import create_session_with_plan, update_session_content
from app.services.llm_client import LLMError
from app.services.rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/lessons", tags=["lessons"])

@router.post("/plan", response_model=PlanGenerationResponse, dependencies=[Depends(check_rate_limit)])
def create_lesson_plan(
    request: LessonRequest,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Generates a structured LessonPlan and immediately persists a LessonSession database row
    keyed by the authenticated learner ID.
    """
    try:
        plan = generate_lesson_plan(request, learner_id=learner.learnerId)
        session_id = create_session_with_plan(learner.learnerId, request, plan, db)
        return PlanGenerationResponse(plan=plan, sessionId=session_id)
    except LLMError as le:
        logger.error(f"LLM generation error in /api/lessons/plan: {le.message}")
        raise HTTPException(
            status_code=le.status_code,
            detail=le.message
        )
    except Exception as e:
        logger.error(f"Unexpected error in /api/lessons/plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate lesson plan due to an internal service error."
        )

@router.post("/generate-content", response_model=ContentGenerationResponse, dependencies=[Depends(check_rate_limit)])
def generate_lesson_content(
    request: ContentGenerationRequest,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Generates speakable narration scripts, on-screen text, and subject-aware visuals for all sections in a lesson plan.
    Saves contentJson to the session row if sessionId is provided.
    """
    try:
        content_response = generate_content_script(request, learner_id=learner.learnerId)
        if request.sessionId:
            update_session_content(request.sessionId, learner.learnerId, content_response, db)
        return content_response
    except LLMError as le:
        logger.error(f"LLM content generation error in /api/lessons/generate-content: {le.message}")
        raise HTTPException(
            status_code=le.status_code,
            detail=le.message
        )
    except Exception as e:
        logger.error(f"Unexpected error in /api/lessons/generate-content: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate section teaching content due to an internal service error."
        )
