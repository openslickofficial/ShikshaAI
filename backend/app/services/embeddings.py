import logging
from typing import List
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Note on Chroma Vector Store Compatibility:
# Any previously-embedded chunks in the local Chroma store used the old 384-dimensional
# 'paraphrase-multilingual-MiniLM-L12-v2' vector space and are incompatible with new
# 768-dimensional Gemini-embedded vectors.
# Since Chroma's data already lives on Render's ephemeral disk (which is wiped on every
# redeploy per existing documented design), production automatically starts with a clean
# vector index. No code path assumes old embeddings survive redeployments.
EMBEDDING_MODEL = "gemini-embedding-001"
OUTPUT_DIMENSIONALITY = 768
MAX_BATCH_SIZE = 100

class EmbeddingError(Exception):
    """Custom exception raised for embedding generation failures."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

def embed(texts: List[str]) -> List[List[float]]:
    """
    Generates embedding vectors for a list of text strings using Google Gemini's
    hosted embedding API. Batches multiple chunks per call to keep ingestion fast.
    Returns list of float vector representations (768-dimensional).
    """
    if not texts:
        return []

    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is missing in backend settings.")
        raise EmbeddingError("GEMINI_API_KEY is not configured on the server.", status_code=500)

    # Sanitize empty or whitespace-only chunks to prevent Gemini API 400 empty part error
    sanitized_texts = [t if (t and t.strip()) else " " for t in texts]

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client for embeddings: {e}")
        raise EmbeddingError("Failed to initialize embedding client.", status_code=500)

    all_embeddings: List[List[float]] = []

    try:
        for i in range(0, len(sanitized_texts), MAX_BATCH_SIZE):
            batch = sanitized_texts[i:i + MAX_BATCH_SIZE]
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=batch,
                config=types.EmbedContentConfig(
                    output_dimensionality=OUTPUT_DIMENSIONALITY
                )
            )
            if not response or not response.embeddings:
                raise EmbeddingError("Empty response returned by Gemini embedding service.")

            for item in response.embeddings:
                all_embeddings.append(list(item.values))

    except EmbeddingError:
        raise
    except APIError as e:
        logger.error(f"Gemini embedding API error: {e}")
        raise EmbeddingError("Embedding service temporarily unavailable. Please try again later.", status_code=502)
    except Exception as e:
        logger.error(f"Unexpected error during embedding generation: {e}")
        raise EmbeddingError(f"Embedding service encountered an error: {str(e)}", status_code=502)

    return all_embeddings
