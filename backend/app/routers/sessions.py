import json
import logging
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.deps import get_current_learner
from app.models.db_models import LearnerProfile, LessonSession, CheckpointRecord
from app.schemas.lesson import LessonPlan
from app.schemas.content import ContentGenerationResponse
from app.schemas.session import (
    CheckpointRecordRequest,
    ReportContent,
    SessionSummary,
    ProfileResponse,
)
from app.services.report_generator import generate_report
from app.services.session_repository import get_session_plan, get_session_content

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/sessions/{session_id}/checkpoint", status_code=status.HTTP_204_NO_CONTENT)
def record_checkpoint(
    session_id: UUID,
    payload: CheckpointRecordRequest,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """Records a single checkpoint attempt for a lesson session."""
    session = db.get(LessonSession, session_id)
    if not session or session.learnerId != learner.learnerId:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson session not found for this learner."
        )

    record = CheckpointRecord(
        sessionId=session_id,
        sectionId=payload.sectionId,
        conceptTitle=payload.conceptTitle,
        checkpointType=payload.checkpointType,
        verdict=payload.verdict,
        misconception=payload.misconception,
        attemptedAt=datetime.utcnow(),
    )
    db.add(record)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/sessions/{session_id}/complete", response_model=ReportContent)
def complete_session(
    session_id: UUID,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """Completes a lesson session, computes score, generates LLM report, and saves results."""
    session = db.get(LessonSession, session_id)
    if not session or session.learnerId != learner.learnerId:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson session not found for this learner."
        )

    records = db.exec(
        select(CheckpointRecord).where(CheckpointRecord.sessionId == session_id)
    ).all()

    report_content = generate_report(session, records)

    session.completedAt = datetime.utcnow()
    session.scorePercent = report_content.scorePercent
    session.reportJson = report_content.model_dump_json()

    db.add(session)
    db.commit()

    return report_content


@router.get("/sessions/{session_id}/plan", response_model=LessonPlan)
def get_stored_lesson_plan(
    session_id: UUID,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """Retrieves the stored LessonPlan for a draft or completed lesson session."""
    return get_session_plan(session_id, learner.learnerId, db)


@router.get("/sessions/{session_id}/content", response_model=Optional[ContentGenerationResponse])
def get_stored_session_content(
    session_id: UUID,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """Retrieves the stored ContentGenerationResponse (teaching content & study material) for a lesson session."""
    return get_session_content(session_id, learner.learnerId, db)


@router.get("/sessions/{session_id}/report", response_model=ReportContent)
def get_session_report(
    session_id: UUID,
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """Retrieves the stored report for a completed lesson session."""
    session = db.get(LessonSession, session_id)
    if not session or session.learnerId != learner.learnerId:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson session not found for this learner."
        )

    if not session.reportJson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report has not been generated for this session yet."
        )

    return ReportContent(**json.loads(session.reportJson))


@router.get("/learners/me/profile", response_model=ProfileResponse)
def get_learner_profile(
    db: DBSession = Depends(get_session),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """Fetches authenticated learner profile summary and cross-session concept mastery stats."""
    learner_id = learner.learnerId

    sessions = db.exec(
        select(LessonSession)
        .where(LessonSession.learnerId == learner_id)
        .order_by(LessonSession.startedAt.desc())
    ).all()

    session_summaries = [
        SessionSummary(
            id=s.id,
            title=s.title,
            level=s.level,
            startedAt=s.startedAt,
            completedAt=s.completedAt,
            scorePercent=s.scorePercent,
            status="completed" if s.completedAt else "draft",
            language=s.language or "English",
        )
        for s in sessions
    ]

    # Compute overall weak and strong concepts across all learner sessions
    session_ids = [s.id for s in sessions]
    if session_ids:
        records = db.exec(
            select(CheckpointRecord).where(CheckpointRecord.sessionId.in_(session_ids))
        ).all()

        weak_counter = Counter()
        strong_counter = Counter()

        for r in records:
            v = (r.verdict or "").lower()
            if v == "incorrect":
                weak_counter[r.conceptTitle] += 1
            elif v == "correct":
                strong_counter[r.conceptTitle] += 1

        overall_weak = [concept for concept, _ in weak_counter.most_common(5)]
        overall_strong = [concept for concept, _ in strong_counter.most_common(5)]
    else:
        overall_weak = []
        overall_strong = []

    return ProfileResponse(
        learnerId=learner.learnerId,
        displayName=learner.displayName,
        sessions=session_summaries,
        overallWeakConcepts=overall_weak,
        overallStrongConcepts=overall_strong,
    )
