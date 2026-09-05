import logging
from typing import Dict, Any
from app.schemas.interaction import EvaluationResult, RemediationContent
from app.services.structured_llm import generate_structured

logger = logging.getLogger(__name__)

def evaluate_answer(question: Dict[str, Any], student_answer: str) -> EvaluationResult:
    """
    Evaluates a student's answer against the checkpoint question (MCQ or rubric).
    Diagnoses misconceptions and decides whether to continue or re-explain.
    """
    q_text = question.get("questionText", "")
    options = question.get("options")
    correct_opt = question.get("correctOption")
    rubric = question.get("rubric")

    prompt = f"""
You are an encouraging, expert Shiksha AI educator evaluating a student's answer to a checkpoint question.

QUESTION DETAILS:
- Question: {q_text}
- Multiple-Choice Options: {options}
- Correct Choice: {correct_opt}
- Grading Rubric: {rubric}

STUDENT RESPONSE:
"{student_answer}"

EVALUATION INSTRUCTIONS:
1. Determine `verdict`:
   - "correct": The answer is accurate and complete.
   - "partial": The answer demonstrates partial understanding but misses key details.
   - "incorrect": The answer is fundamentally wrong or reflects a core misunderstanding.

2. Identify `misconception`:
   - If verdict is "incorrect" or "partial", explain *why* the student got it wrong (e.g., "Confused gradient direction with magnitude", "Mistook secant line for tangent line").
   - If verdict is "correct", set `misconception` to null.

3. Formulate `feedback`:
   - Provide friendly, constructive, 2-3 sentence feedback. Explain why the correct answer is right and clarify any misunderstanding.

4. Set `decision`:
   - Set decision to "reexplain" ONLY if verdict is "incorrect".
   - For "correct" or "partial", set decision to "continue".

Generate JSON adhering strictly to the schema.
"""

    return generate_structured(prompt, EvaluationResult)

def generate_remediation(
    question: Dict[str, Any],
    student_answer: str,
    evaluation: Dict[str, Any]
) -> RemediationContent:
    """
    Generates a 1-round adaptive re-explanation for a student who answered incorrectly.
    Switches to a genuinely different teaching approach (e.g. definition -> analogy or visual model).
    """
    q_text = question.get("questionText", "")
    misconception = evaluation.get("misconception", "a misunderstanding of the fundamental concept")
    feedback = evaluation.get("feedback", "")

    prompt = f"""
You are an empathetic Shiksha AI educator creating a quick 1-round re-explanation for a student who struggled with a concept.

CONTEXT:
- Original Question: {q_text}
- Student's Answer: "{student_answer}"
- Diagnosed Misconception: {misconception}
- Diagnostic Feedback: {feedback}

REMEDIATION INSTRUCTIONS:
1. Choose a genuinely different teaching perspective in `newExplanationApproach` (e.g., 'Analogy-First', 'Step-by-Step Mechanical Flow', 'Real-World Everyday Analogy').
2. Write a clear, encouraging `headline` (e.g. "Let's Think of It Like Walking Down a Hill").
3. Create `narrationBeats`: EXACTLY 2 to 4 short, clear narration sentences that directly address and clear up the diagnosed misconception without using jargon.

Generate JSON adhering strictly to the schema.
"""

    return generate_structured(prompt, RemediationContent)
