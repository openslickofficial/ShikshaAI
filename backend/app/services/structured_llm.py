import logging
from typing import Type, TypeVar
from pydantic import BaseModel
from app.services.llm_client import generate_json_response, LLMError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

def generate_structured(prompt: str, schema: Type[T], system_instruction: str = "") -> T:
    """
    Generic helper to invoke Gemini in JSON mode, validate the output against a Pydantic schema,
    and automatically retry once with error feedback if parsing or schema validation fails.
    """
    # Attempt 1
    try:
        raw_json = generate_json_response(prompt, system_instruction=system_instruction)
        validated = schema.model_validate(raw_json)
        return validated
    except LLMError as le:
        logger.warning(f"Attempt 1 structured generation failed: {le.message}. Retrying with feedback...")
    except Exception as err1:
        logger.warning(f"Attempt 1 schema validation failed: {err1}. Retrying with feedback...")


    # Attempt 2 (Retry)
    retry_prompt = f"""
{prompt}

CRITICAL RETRY INSTRUCTION:
Your previous output failed schema validation. Output strictly valid JSON conforming to the requested schema without markdown formatting or additional surrounding text.
"""
    try:
        raw_json_retry = generate_json_response(retry_prompt, system_instruction=system_instruction)
        validated_retry = schema.model_validate(raw_json_retry)
        return validated_retry
    except Exception as err2:
        logger.error(f"Attempt 2 retry failed for schema {schema.__name__}: {err2}")
        raise LLMError(
            f"Failed to generate valid structured response matching {schema.__name__} after retry: {str(err2)}",
            status_code=502
        )
