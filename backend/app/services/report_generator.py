import logging
from typing import List
from app.models.db_models import LessonSession, CheckpointRecord
from app.schemas.session import ReportContent
from app.services.structured_llm import generate_structured

logger = logging.getLogger(__name__)

def compute_score(records: List[CheckpointRecord]) -> float:
    """
    Computes a deterministic score percentage from checkpoint records:
    correct = 1.0, partial = 0.5, incorrect = 0.0.
    Averages these scores and returns a percentage float (0.0 - 100.0).
    """
    if not records:
        return 100.0

    total_points = 0.0
    for r in records:
        v = (r.verdict or "").lower()
        if v == "correct":
            total_points += 1.0
        elif v == "partial":
            total_points += 0.5
        else:
            total_points += 0.0

    score = (total_points / len(records)) * 100.0
    return round(score, 1)

def generate_report(session: LessonSession, records: List[CheckpointRecord]) -> ReportContent:
    """
    Synthesizes a personalized ReportContent for a completed lesson session using Gemini LLM.
    The score is deterministically pre-computed in Python and injected as an unalterable fact.
    """
    score_percent = compute_score(records)

    correct_concepts = [r.conceptTitle for r in records if (r.verdict or "").lower() == "correct"]
    partial_concepts = [r.conceptTitle for r in records if (r.verdict or "").lower() == "partial"]
    incorrect_concepts = [
        f"{r.conceptTitle} (Misconception: {r.misconception})" if r.misconception else r.conceptTitle
        for r in records if (r.verdict or "").lower() == "incorrect"
    ]

    prompt = f"""
You are an expert Shiksha AI educator generating a concise, encouraging, and actionable learning report for a completed lesson.

LESSON CONTEXT:
- Title: "{session.title}"
- Level: {session.level}
- Language: {session.language}
- Pre-computed Deterministic Score: {score_percent}%

PERFORMANCE BREAKDOWN BY CONCEPT:
- Correct First Try Concepts: {correct_concepts if correct_concepts else 'None'}
- Partially Correct Concepts: {partial_concepts if partial_concepts else 'None'}
- Incorrect Concepts / Misconceptions Diagnosed: {incorrect_concepts if incorrect_concepts else 'None'}

INSTRUCTIONS:
1. Retain scorePercent as EXACTLY {score_percent}.
2. In 'strongAreas', list concept names where the learner demonstrated clear understanding.
3. In 'weakAreas', list concept names where the learner struggled or held misconceptions.
4. In 'recommendation', write a short (2-3 sentences) diagnostic recommendation on what to focus on next.
5. In 'suggestedNextTopic', suggest ONE specific, highly relevant follow-up topic in {session.language} that builds logically on this lesson.
"""

    system_instruction = (
        "You are an empathetic, precise educational evaluator. Write high-quality educational feedback "
        "matching the requested schema strictly."
    )

    try:
        report = generate_structured(
            prompt=prompt,
            schema=ReportContent,
            system_instruction=system_instruction
        )
        # Guarantee pre-computed Python score is preserved
        report.scorePercent = score_percent
        return report
    except Exception as e:
        logger.error(f"Failed to generate LLM report, returning fallback report: {e}")
        strong = [r.conceptTitle for r in records if (r.verdict or "").lower() in ("correct", "partial")]
        weak = [r.conceptTitle for r in records if (r.verdict or "").lower() == "incorrect"]
        return ReportContent(
            scorePercent=score_percent,
            strongAreas=strong if strong else [session.title],
            weakAreas=weak,
            recommendation=f"Great job finishing {session.title}! Review the core concepts to solidify your understanding.",
            suggestedNextTopic="Advanced Applications"
        )
