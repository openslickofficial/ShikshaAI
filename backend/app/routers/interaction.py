import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from app.deps import get_current_learner
from app.models.db_models import LearnerProfile
from app.schemas.interaction import CheckpointQuestion, EvaluationResult, RemediationContent
from app.services.checkpoint_generator import generate_checkpoint
from app.services.answer_evaluator import evaluate_answer, generate_remediation
from app.services.stt_provider import get_stt_provider, STTError
from app.services.structured_llm import LLMError
from app.services.rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interaction", tags=["interaction"])

class CheckpointRequest(BaseModel):
    section: Dict[str, Any]
    content: Dict[str, Any]

class EvaluationRequest(BaseModel):
    question: Dict[str, Any]
    studentAnswer: str

class RemediationRequest(BaseModel):
    question: Dict[str, Any]
    studentAnswer: str
    evaluation: Dict[str, Any]

class TranscribeResponse(BaseModel):
    text: str

@router.post("/checkpoint", response_model=CheckpointQuestion, dependencies=[Depends(check_rate_limit)])
def create_checkpoint(
    request: CheckpointRequest,
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Generates a comprehension question (MCQ or open) for a lesson section.
    """
    try:
        return generate_checkpoint(request.section, request.content)
    except LLMError as le:
        logger.error(f"LLM Error generating checkpoint question: {le}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(le))
    except Exception as e:
        logger.error(f"Unexpected error generating checkpoint: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate checkpoint question.")

@router.post("/evaluate", response_model=EvaluationResult, dependencies=[Depends(check_rate_limit)])
def evaluate_student_answer(
    request: EvaluationRequest,
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Evaluates a student's answer, identifies misconceptions, and determines decision (continue/reexplain).
    """
    try:
        return evaluate_answer(request.question, request.studentAnswer)
    except LLMError as le:
        logger.error(f"LLM Error evaluating answer: {le}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(le))
    except Exception as e:
        logger.error(f"Unexpected error evaluating answer: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to evaluate student answer.")

@router.post("/remediate", response_model=RemediationContent, dependencies=[Depends(check_rate_limit)])
def remediate_misconception(
    request: RemediationRequest,
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Generates a 1-round adaptive re-explanation targeting the diagnosed misconception.
    """
    try:
        return generate_remediation(request.question, request.studentAnswer, request.evaluation)
    except LLMError as le:
        logger.error(f"LLM Error generating remediation: {le}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(le))
    except Exception as e:
        logger.error(f"Unexpected error generating remediation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate remediation content.")

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_voice(
    file: UploadFile = File(...),
    learner: LearnerProfile = Depends(get_current_learner),
):
    """
    Transcribes uploaded voice audio file into text using configured STT Provider (Mock / Whisper).
    """
    try:
        audio_bytes = await file.read()
        provider = get_stt_provider()
        transcript = provider.transcribe(audio_bytes)
        return {"text": transcript}
    except STTError as se:
        logger.error(f"STT Provider error: {se.message}")
        raise HTTPException(status_code=se.status_code, detail=se.message)
    except Exception as e:
        logger.error(f"Unexpected error transcribing audio: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to transcribe audio due to an internal processing error.")

