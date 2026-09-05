import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Load SentenceTransformer model once at module initialization time
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
logger.info(f"Loading embedding model: {MODEL_NAME}...")
_embedding_model = SentenceTransformer(MODEL_NAME)
logger.info("Embedding model loaded successfully.")

def embed(texts: List[str]) -> List[List[float]]:
    """
    Generates embedding vectors for a list of text strings.
    Returns list of float vector representations.
    """
    if not texts:
        return []
    embeddings = _embedding_model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()
