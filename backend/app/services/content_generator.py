import logging
from typing import List, Dict, Any
from app.schemas.content import ContentGenerationRequest, ContentGenerationResponse
from app.services.vector_store import get_chunks_by_ids
from app.services.material_store import get_material_meta
from app.services.llm_client import LLMError
from app.services.structured_llm import generate_structured
from app.services.groq_client import generate_groq_explanation

logger = logging.getLogger(__name__)

CONTENT_SYSTEM_INSTRUCTION = """
You are an expert AI Educator & Content Producer combining Gemini's structured visual schema capabilities with Groq Cloud's ultra-fast LPU intuitive storytelling.
Your job is to transform a complete LessonPlan into detailed, speakable script content and subject-aware interactive visual specifications for EVERY section in the plan.

You MUST generate content for ALL sections in a single JSON response matching the following schema strictly:

{
  "sections": [
    {
      "sectionId": "string - matching the plan section's id",
      "narrationBeats": [
        "string - 3 to 6 short, speakable, natural sentences per section. NO markdown, NO bullet points, NO special characters. This will be spoken directly by audio TTS."
      ],
      "onScreenHeadline": "string - punchy, clear main heading displayed on screen",
      "onScreenBullets": [
        "string - 2 to 4 concise, key takeaways"
      ],
      "visualType": "equation | graph | code | diagram | timeline | none",
      "visualReason": "string - one concise sentence explaining why this visual representation was selected",
      "visualSpec": {
        // MUST MATCH THE CHOSEN visualType SCHEMA EXACTLY:
        // For "equation": { "latex": "E = mc^2" }
        // For "graph": { "chartType": "line"|"bar"|"scatter", "xLabel": "X", "yLabel": "Y", "series": [{"name": "Series 1", "points": [{"x": 0, "y": 1}]}] }
        // For "code": { "language": "python", "snippet": "print('hello')", "expectedOutput": "hello" }
        // For "diagram": { "mermaidCode": "graph TD\\n  A[Start] --> B[End]" }
        // For "timeline": { "events": [{"label": "Phase 1", "order": 1, "detail": "Initial setup"}] }
        // For "none": {}
      }
    }
  ]
}

VISUAL TYPE SELECTION GUIDELINES:
1. Mathematics / Physics / Formulas: Use "equation" with clean KaTeX LaTeX syntax (e.g. `\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`).
2. Data Trends / Functions / Comparisons / Stats: Use "graph" with line, bar, or scatter numeric data points.
3. Computer Science / Programming / Algorithms: Use "code" with short (<15 lines), executable-looking code snippets and expected output.
4. Processes / Workflows / Systems / Architectures: Use "diagram" with valid Mermaid flowchart syntax (e.g. `graph TD\\n  A --> B`).
5. History / Sequential Steps / Historical Eras / Milestones: Use "timeline" with ordered events (order: 1, 2, 3...).
6. Non-Visual / Pure Discussion Checkpoints: Use "none" with `{}`.

Tone & Style: High clarity, deeply intuitive analogies, engaging. Output pure JSON matching schema strictly.
"""

def build_content_generation_prompt(request: ContentGenerationRequest, section_excerpts: Dict[str, List[Dict[str, str]]]) -> str:
    plan = request.plan
    prompt_lines = [
        f'Generate full teaching script and subject-aware visuals for the lesson plan: "{plan.title}"',
        f"Difficulty Level: {plan.level}",
        f"Total Minutes: {plan.totalMinutes}",
        "",
        "SECTION BREAKDOWN & SOURCE EXCERPTS:"
    ]

    for section in plan.sections:
        prompt_lines.append(f"\n--- Section ID: {section.id} ---")
        prompt_lines.append(f"Title: {section.conceptTitle}")
        prompt_lines.append(f"Depth: {section.depth}")
        prompt_lines.append(f"Explanation Approach: {section.explanationApproach}")
        prompt_lines.append(f"Example Ideas: {', '.join(section.exampleIdeas)}")
        prompt_lines.append(f"Has Checkpoint: {section.hasCheckpoint} ({section.checkpointType or 'None'})")

        excerpts = section_excerpts.get(section.id, [])
        if excerpts:
            prompt_lines.append("Grounded Document Excerpts:")
            for ex in excerpts:
                prompt_lines.append(f"  [{ex['chunkId']}] ({ex['sourceRef']}): \"{ex['text']}\"")

    prompt_lines.append("\nGenerate content for ALL sections listed above matching the JSON schema strictly.")
    return "\n".join(prompt_lines)

def generate_content_script(request: ContentGenerationRequest, learner_id: str = None) -> ContentGenerationResponse:
    """
    Generates study material (narration beats, headlines, bullets, visuals) for all sections in a LessonPlan using a Gemini + Groq Cloud Hybrid Ensemble engine.
    Enforces learner ownership scoping for uploaded materials.
    """
    section_excerpts: Dict[str, List[Dict[str, str]]] = {}

    # Check if upload mode and pull grounded excerpts per section with strict ownership check
    if getattr(request.source, "mode", None) == "upload":
        material_id = getattr(request.source, "materialId", "")
        if material_id:
            meta = get_material_meta(material_id, learner_id=learner_id)
            if not meta:
                raise LLMError(f"Uploaded material with ID '{material_id}' was not found or access is denied for this learner. Please re-upload your file.", status_code=404)
            for section in request.plan.sections:
                if section.groundedChunkIds:
                    chunks = get_chunks_by_ids(material_id, section.groundedChunkIds, learner_id=learner_id)
                    if chunks:
                        section_excerpts[section.id] = chunks

    prompt = build_content_generation_prompt(request, section_excerpts)

    # 1. Query Groq Cloud LPU API for concise creative real-world analogies and narrative breakdowns
    section_titles = [f"{s.conceptTitle} ({', '.join(s.exampleIdeas)})" for s in request.plan.sections]
    groq_prompt = (
        f"Lesson Topic: {request.plan.title} (Level: {request.plan.level})\n"
        f"Sections: {'; '.join(section_titles)}\n\n"
        f"Provide short, deep, engaging real-world analogies and narration ideas for each section."
    )

    groq_insights = generate_groq_explanation(prompt=groq_prompt)

    if groq_insights:
        logger.info("Hybrid Ensemble Active: Combining Groq Cloud's creative analogies with Gemini's structured visual schema...")
        prompt = (
            f"{prompt}\n\n"
            f"=== GROQ CLOUD CREATIVE ANALOGIES & NARRATIVE INSIGHTS ===\n"
            f"{groq_insights}\n"
            f"==========================================================\n"
            f"Integrate Groq's creative analogies above into your narration beats while strictly adhering to the JSON schema."
        )

    # 2. Synthesize structured Pydantic response with Gemini
    response = generate_structured(
        prompt=prompt,
        schema=ContentGenerationResponse,
        system_instruction=CONTENT_SYSTEM_INSTRUCTION
    )
    return response
