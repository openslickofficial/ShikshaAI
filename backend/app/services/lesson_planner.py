import logging
from typing import List, Dict
from app.schemas.lesson import LessonRequest, LessonPlan, TopicSource, UploadSource
from app.services.llm_client import LLMError
from app.services.structured_llm import generate_structured
from app.services.material_store import get_material_meta
from app.services.vector_store import query_similar, sample_spread

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """
You are an expert AI Master Educator. Your job is to construct a highly structured, pedagogical lesson plan in JSON format based on the user's specific learning request and provided document excerpts (if available).

You MUST respond strictly with a valid JSON object matching the following JSON Schema:

{
  "title": "string - catchy, educational title",
  "level": "beginner | intermediate | advanced",
  "totalMinutes": number,
  "sections": [
    {
      "id": "string - unique section id like sec-1",
      "conceptTitle": "string - clear concept title",
      "depth": "intro | core | advanced",
      "explanationApproach": "string - e.g. 'analogy-first', 'definition then example', 'step-by-step calculation'",
      "exampleIdeas": ["string - 1 to 3 short example descriptions"],
      "hasCheckpoint": boolean,
      "checkpointType": "conceptual | mcq | short-answer | application (only present if hasCheckpoint is true)",
      "estimatedMinutes": number,
      "groundedChunkIds": ["string - chunk ID tag like chk-0, chk-1 from the retrieved excerpts used for this section"]
    }
  ]
}

REQUISITE RULES:
1. Time Allocation (`timeAvailable`):
   - "5min": Produce 2 short intro sections (total 5 mins).
   - "20min": Produce 3-4 structured sections (total 20 mins).
   - "60min": Produce 5-6 comprehensive sections (total 60 mins).
   - "7day": Produce 7 structured daily revision sections (total ~140-210 mins).
2. Level (`level`): Match difficulty ('beginner', 'intermediate', 'advanced').
3. Teaching Style (`teachingStyle`): Reflect 'simple-examples', 'technical-detailed', or 'exam-focused'.
4. Language (`language`): Keep concept titles and explanations in the requested language.
5. Grounding: If Document Excerpts are provided, base section content strictly on them. If excerpts lack coverage for a concept, keep that section brief rather than inventing content. Include relevant excerpt chunk IDs in `groundedChunkIds`.
6. Output pure JSON without markdown fences.
"""

def build_planning_prompt(request: LessonRequest, excerpts: List[Dict[str, str]] = None) -> str:
    if isinstance(request.source, UploadSource) or getattr(request.source, 'mode', None) == 'upload':
        filename = getattr(request.source, 'filename', 'Uploaded Document')
        topic_name = f"Document: {filename}"
    else:
        topic_name = request.source.topic if isinstance(request.source, TopicSource) else 'Requested Subject'
    
    interests_str = ", ".join(request.interests) if request.interests else "None specified"
    notes_str = request.notes if request.notes else "None specified"

    prompt_lines = [
        f'Construct a complete lesson plan for: "{topic_name}"',
        "",
        "User Parameters:",
        f"- Target Subject / File: {topic_name}",
        f"- Difficulty Level: {request.level}",
        f"- Time Available: {request.timeAvailable}",
        f"- Requested Language: {request.language}",
        f"- Teaching Style: {request.teachingStyle}",
        f"- Learner Personal Interests: {interests_str}",
        f"- Additional Notes / Query: {notes_str}",
    ]

    if request.priorWeakConcepts:
        weak_str = ", ".join(request.priorWeakConcepts)
        prompt_lines.append(
            f"This learner has previously struggled with: {weak_str}. If any of these concepts are relevant to this topic, include extra reinforcement or a dedicated section for them."
        )


    if excerpts:
        prompt_lines.append("")
        prompt_lines.append("--- RETRIEVED DOCUMENT MATERIAL EXCERPTS ---")
        prompt_lines.append("Base the lesson plan strictly on the following indexed document excerpts:")
        for ex in excerpts:
            c_id = ex.get("chunkId", "")
            s_ref = ex.get("sourceRef", "")
            text = ex.get("text", "")
            prompt_lines.append(f"[{c_id}] ({s_ref}):\n\"{text}\"\n")
        prompt_lines.append("--------------------------------------------")
        prompt_lines.append("IMPORTANT: Populate `groundedChunkIds` for each section with the chunk ID tags (e.g. ['chk-0', 'chk-2']) actually referenced.")

    prompt_lines.append("")
    prompt_lines.append("Ensure section estimatedMinutes sum to totalMinutes. Output valid JSON matching the schema strictly.")

    return "\n".join(prompt_lines)

def generate_lesson_plan(request: LessonRequest, learner_id: str = None) -> LessonPlan:
    """
    Generates a LessonPlan from a LessonRequest using shared generate_structured LLM service.
    Supports both Topic mode and RAG Upload mode.
    """
    excerpts: List[Dict[str, str]] = []
    valid_chunk_ids = set()

    # RAG Retrieval for Upload Mode
    if request.source.mode == "upload":
        material_id = request.source.materialId
        meta = get_material_meta(material_id, learner_id=learner_id)
        if not meta:
            raise LLMError(f"Uploaded material with ID '{material_id}' was not found or access is denied for this learner. Please re-upload your file.", status_code=404)

        if request.notes and request.notes.strip():
            excerpts = query_similar(material_id, request.notes.strip(), k=6)
        else:
            excerpts = sample_spread(material_id, n=6)

        valid_chunk_ids = {e.get("chunkId") for e in excerpts if e.get("chunkId")}

    prompt = build_planning_prompt(request, excerpts)

    plan = generate_structured(prompt, LessonPlan, system_instruction=SYSTEM_INSTRUCTION)

    # Post-validation for groundedChunkIds
    if valid_chunk_ids:
        for section in plan.sections:
            if section.groundedChunkIds:
                section.groundedChunkIds = [cid for cid in section.groundedChunkIds if cid in valid_chunk_ids]

    return plan
