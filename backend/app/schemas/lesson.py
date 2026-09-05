from typing import Literal, List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, Field

class UploadSource(BaseModel):
    mode: Literal["upload"]
    materialId: str
    filename: str

class TopicSource(BaseModel):
    mode: Literal["topic"]
    topic: str

LessonSource = Union[UploadSource, TopicSource]

class LessonRequest(BaseModel):
    source: LessonSource = Field(discriminator="mode")
    level: Literal["beginner", "intermediate", "advanced"]
    timeAvailable: Literal["5min", "20min", "60min", "7day"]
    language: str = "English"
    teachingStyle: Literal["simple-examples", "technical-detailed", "exam-focused"]
    interests: Optional[List[str]] = Field(default=None, max_length=2)
    notes: Optional[str] = None
    priorWeakConcepts: Optional[List[str]] = None


class LessonSection(BaseModel):
    id: str
    conceptTitle: str
    depth: Literal["intro", "core", "advanced"]
    explanationApproach: str
    exampleIdeas: List[str]
    hasCheckpoint: bool
    checkpointType: Optional[Literal["conceptual", "mcq", "short-answer", "application"]] = None
    estimatedMinutes: int
    groundedChunkIds: Optional[List[str]] = Field(default=None)

class LessonPlan(BaseModel):
    title: str
    level: Literal["beginner", "intermediate", "advanced"]
    totalMinutes: int
    sections: List[LessonSection]

class PlanGenerationResponse(BaseModel):
    plan: LessonPlan
    sessionId: UUID
