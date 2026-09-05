import logging
from typing import Dict, Any
from app.schemas.interaction import CheckpointQuestion
from app.services.structured_llm import generate_structured

logger = logging.getLogger(__name__)

def generate_checkpoint(section: Dict[str, Any], content: Dict[str, Any]) -> CheckpointQuestion:
    """
    Generates a targeted comprehension checkpoint question for a section.
    For MCQ questions, provides 4 plausible choices with realistic distractors.
    For open questions, provides a clear grading rubric.
    """
    concept_title = section.get("conceptTitle", "Lesson Concept")
    checkpoint_type = section.get("checkpointType", "multiple-choice")
    headline = content.get("onScreenHeadline", "")
    beats = content.get("narrationBeats", [])
    beats_str = "\n".join(f"- {b}" for b in beats)

    prompt = f"""
You are an expert AI Tutor crafting a quick comprehension checkpoint question for a student.

SECTION METADATA:
- Concept Title: {concept_title}
- Checkpoint Type: {checkpoint_type}
- Key Headline: {headline}
- Narration Content:
{beats_str}

INSTRUCTIONS:
1. Create a clear, engaging question testing whether the student understood this section's core principle.
2. If checkpointType is 'multiple-choice' or contains 'mcq' or 'choice':
   - Provide EXACTLY 4 options in `options`.
   - Ensure `correctOption` matches one of the 4 options exactly.
   - The 3 incorrect options must represent plausible student misconceptions, not obvious random wrong answers.
3. If checkpointType is short-answer, application, or open-ended:
   - Set `options` and `correctOption` to null.
   - Provide a clear `rubric` string describing what key concepts a strong student answer must include.

Generate JSON adhering strictly to the schema.
"""

    return generate_structured(prompt, CheckpointQuestion)
