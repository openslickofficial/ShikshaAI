import json
import logging
from typing import Optional
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session as DBSession

from app.models.db_models import LessonSession
from app.deps import get_or_create_learner
from app.schemas.lesson import LessonRequest, LessonPlan
from app.schemas.content import ContentGenerationResponse, SectionContent

logger = logging.getLogger(__name__)

def create_session_with_plan(
    learner_id: str,
    request: LessonRequest,
    plan: LessonPlan,
    db: DBSession,
) -> UUID:
    """
    Creates a new LessonSession row immediately when a plan is generated.
    Stores planJson and initial metadata.
    """
    get_or_create_learner(db, learner_id)

    session = LessonSession(
        learnerId=learner_id,
        title=plan.title,
        level=plan.level,
        language=request.language or "English",
        startedAt=datetime.utcnow(),
        completedAt=None,
        planJson=plan.model_dump_json(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info(f"Created LessonSession {session.id} for learner {learner_id}")
    return session.id

def update_session_content(
    session_id: UUID,
    learner_id: str,
    content: ContentGenerationResponse,
    db: DBSession,
) -> None:
    """
    Updates an existing LessonSession row with contentJson after script generation.
    Checks learner ownership.
    """
    session = db.get(LessonSession, session_id)
    if not session or session.learnerId != learner_id:
        logger.error(f"update_session_content failed: session {session_id} not found or learner mismatch")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson session not found for this learner."
        )

    session.contentJson = content.model_dump_json()
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info(f"Successfully saved contentJson ({len(content.sections)} sections) to session {session_id}")

def get_session_plan(
    session_id: UUID,
    learner_id: str,
    db: DBSession,
) -> LessonPlan:
    """
    Retrieves and parses stored planJson for a session.
    Checks learner ownership.
    """
    session = db.get(LessonSession, session_id)
    if not session or session.learnerId != learner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson session not found for this learner."
        )

    if not session.planJson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson plan data not found for this session."
        )

    return LessonPlan(**json.loads(session.planJson))

def get_session_content(
    session_id: UUID,
    learner_id: str,
    db: DBSession,
) -> Optional[ContentGenerationResponse]:
    """
    Retrieves and parses stored contentJson for a session.
    Checks learner ownership. Returns None if content has not been generated yet.
    """
    session = db.get(LessonSession, session_id)
    if not session or session.learnerId != learner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson session not found for this learner."
        )

    if not session.contentJson or not session.contentJson.strip():
        return None

    try:
        data = json.loads(session.contentJson)
        return ContentGenerationResponse.model_validate(data)
    except Exception as e:
        logger.warning(f"Strict parsing of contentJson failed for session {session_id}, attempting fallback: {e}")
        try:
            data = json.loads(session.contentJson)
            if isinstance(data, dict) and "sections" in data:
                sections_raw = data["sections"]
                valid_sections = [SectionContent.model_validate(s) for s in sections_raw]
                return ContentGenerationResponse(sections=valid_sections)
        except Exception as inner_e:
            logger.error(f"Fallback parsing of contentJson also failed for session {session_id}: {inner_e}")
            return None
