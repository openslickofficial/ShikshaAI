from typing import Literal, List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from app.schemas.lesson import LessonPlan, LessonSource

class EquationSpec(BaseModel):
    latex: str

class GraphPoint(BaseModel):
    x: float
    y: float

class GraphSeries(BaseModel):
    name: str
    points: List[GraphPoint]

class GraphSpec(BaseModel):
    chartType: Literal["line", "bar", "scatter"]
    xLabel: str
    yLabel: str
    series: List[GraphSeries]

class CodeSpec(BaseModel):
    language: str
    snippet: str
    expectedOutput: Optional[str] = None

class DiagramSpec(BaseModel):
    mermaidCode: str

class TimelineEvent(BaseModel):
    label: str
    order: int
    detail: Optional[str] = None

class TimelineSpec(BaseModel):
    events: List[TimelineEvent]

class NoneSpec(BaseModel):
    pass

class SectionContent(BaseModel):
    sectionId: str
    narrationBeats: List[str] = Field(default_factory=list, description="3 to 6 speakable, natural sentences per section. No markdown or special formatting.")
    onScreenHeadline: str = Field(default="")
    onScreenBullets: List[str] = Field(default_factory=list)
    visualType: str = Field(default="none", description="equation | graph | code | diagram | timeline | none")
    visualSpec: Dict[str, Any] = Field(default_factory=dict, description="JSON spec dictionary matching the visualType schema.")
    visualReason: Optional[str] = Field(default="", description="One concise sentence explaining why this visual type was chosen for this section.")

from uuid import UUID

class ContentGenerationRequest(BaseModel):
    plan: LessonPlan
    source: LessonSource = Field(discriminator="mode")
    sessionId: Optional[UUID] = None

class ContentGenerationResponse(BaseModel):
    sections: List[SectionContent]
