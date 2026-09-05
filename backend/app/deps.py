from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models.db_models import LearnerProfile
from app.services.auth import verify_token, AuthError

def get_or_create_learner(
    db: DBSession,
    learner_id: str,
    display_name: str = "Learner",
) -> LearnerProfile:
    """Retrieves or persists a LearnerProfile database record for the given learnerId."""
    learner = db.exec(select(LearnerProfile).where(LearnerProfile.learnerId == learner_id)).first()
    if not learner:
        name_to_use = display_name if (display_name and display_name.strip()) else "Learner"
        learner = LearnerProfile(learnerId=learner_id, displayName=name_to_use)
        db.add(learner)
        db.commit()
        db.refresh(learner)
    return learner

def get_current_learner(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: DBSession = Depends(get_session),
) -> LearnerProfile:
    """
    Dependency verifying the Bearer token in the Authorization header via Supabase JWKS,
    and returning the authenticated LearnerProfile row.
    """
    if not authorization or not authorization.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.strip().split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    try:
        auth_data = verify_token(token)
    except AuthError as ae:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ae.detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    learner_id = auth_data["sub"]
    display_name = auth_data.get("displayName")
    return get_or_create_learner(db, learner_id, display_name or "Learner")
