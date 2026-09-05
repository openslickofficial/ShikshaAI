from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from uuid import UUID

class CheckpointRecordRequest(BaseModel):
    sectionId: str
    conceptTitle: str
    checkpointType: str
    verdict: str
    misconception: Optional[str] = None

class ReportContent(BaseModel):
    scorePercent: float = Field(description="Deterministically computed percentage score.")
    strongAreas: List[str] = Field(description="Concepts where the learner demonstrated strong understanding.")
    weakAreas: List[str] = Field(description="Concepts where the learner struggled or held misconceptions.")
    recommendation: str = Field(description="Short diagnostic advice on how to improve.")
    suggestedNextTopic: str = Field(description="Targeted next topic recommendation for the learner.")

class SessionSummary(BaseModel):
    id: UUID
    title: str
    level: str
    startedAt: datetime
    completedAt: Optional[datetime] = None
    scorePercent: Optional[float] = None
    status: Literal["draft", "completed"]
    language: Optional[str] = "English"

class ProfileResponse(BaseModel):
    learnerId: str
    displayName: str
    sessions: List[SessionSummary]
    overallWeakConcepts: List[str]
    overallStrongConcepts: List[str]
