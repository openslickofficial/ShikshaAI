from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field

# NOTE: Since no migration tool (Alembic) is configured for this demo,
# any local dev data/app.db pre-dating Phase 12 columns should be deleted
# once so create_db_and_tables() auto-recreates the table schema cleanly.

class LearnerProfile(SQLModel, table=True):
    # NOTE: learnerId holds a client-generated UUID (localStorage scheme). If Supabase Auth is added in a future phase, real authenticated user UUIDs can populate this exact same field with no schema change required.
    learnerId: str = Field(primary_key=True)
    displayName: str = Field(default="Learner")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class LessonSession(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    learnerId: str = Field(foreign_key="learnerprofile.learnerId", index=True)
    title: str
    level: str
    language: str
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = Field(default=None)
    scorePercent: Optional[float] = Field(default=None)
    reportJson: Optional[str] = Field(default=None)
    planJson: Optional[str] = Field(default=None)
    contentJson: Optional[str] = Field(default=None)

class CheckpointRecord(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    sessionId: UUID = Field(foreign_key="lessonsession.id", index=True)
    sectionId: str
    conceptTitle: str
    checkpointType: str
    verdict: str
    misconception: Optional[str] = Field(default=None)
    attemptedAt: datetime = Field(default_factory=datetime.utcnow)
