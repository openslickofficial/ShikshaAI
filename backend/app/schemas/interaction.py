from pydantic import BaseModel, Field, AliasChoices
from typing import List, Optional, Literal

class CheckpointQuestion(BaseModel):
    checkpointType: str = Field(
        default="multiple-choice",
        validation_alias=AliasChoices('checkpointType', 'type'),
        description="Type of question (e.g. 'multiple-choice', 'short-answer', 'application')."
    )
    questionText: str = Field(
        validation_alias=AliasChoices('questionText', 'question'),
        description="Clear, engaging question testing concept comprehension."
    )
    options: Optional[List[str]] = Field(
        default=None,
        description="Exactly 4 options for multiple-choice questions, including 1 correct and 3 misconception-based distractors."
    )
    correctOption: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices('correctOption', 'correct_answer', 'answer'),
        description="The correct option string for multiple-choice questions."
    )
    rubric: Optional[str] = Field(
        default=None,
        description="Key grading points and expected concepts for open-ended questions."
    )

class EvaluationResult(BaseModel):
    verdict: Literal["correct", "partial", "incorrect"] = Field(description="Grading verdict.")
    misconception: Optional[str] = Field(default=None, description="Specific misunderstanding or flaw in reasoning if answer is incorrect/partial.")
    feedback: str = Field(description="Constructive, encouraging feedback explaining why the answer is right or diagnosing the misconception.")
    decision: Literal["continue", "reexplain"] = Field(description="'reexplain' ONLY if verdict is 'incorrect', 'continue' for 'correct' or 'partial'.")

class RemediationContent(BaseModel):
    newExplanationApproach: str = Field(
        validation_alias=AliasChoices('newExplanationApproach', 'approach'),
        description="The alternative teaching perspective used (e.g. 'analogy-first', 'real-world example', 'visual step-by-step')."
    )
    headline: str = Field(description="Punchy headline summarizing the re-explanation focus.")
    narrationBeats: List[str] = Field(
        validation_alias=AliasChoices('narrationBeats', 'beats'),
        description="2 to 4 concise, clear narration sentences addressing the diagnosed misconception."
    )
