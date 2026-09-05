import os
import logging
from typing import List, Dict
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.services.embeddings import embed

logger = logging.getLogger(__name__)

# Note on Embedding Compatibility & Ephemeral Storage:
# Any previously-embedded chunks in a local Chroma store used the old 384-dimensional
# 'paraphrase-multilingual-MiniLM-L12-v2' vector space and are incompatible with new
# 768-dimensional Gemini embeddings. Because Chroma's storage lives on Render's
# ephemeral disk (wiped on every redeploy per existing documented design), production
# deployments automatically initialize a fresh, consistent 768-dimensional vector index.
# No code path assumes old embeddings survive redeployments.
# Persistent Chroma Client at backend/data/chroma
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma")
os.makedirs(DATA_DIR, exist_ok=True)

_chroma_client = chromadb.PersistentClient(path=DATA_DIR)
_collection = _chroma_client.get_or_create_collection(
    name="materials_collection",
    metadata={"hnsw:space": "cosine"}
)

def add_material(material_id: str, chunks: List[Dict[str, str]], embeddings: List[List[float]], learner_id: str = ""):
    """
    Persists document material chunks and embedding vectors into ChromaDB.
    Scopes chunks by materialId and uploading learnerId.
    """
    if not chunks:
        return

    ids = [f"{material_id}_{c['chunkId']}" for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [
        {
            "materialId": material_id,
            "chunkId": c["chunkId"],
            "sourceRef": c["sourceRef"],
            "learnerId": learner_id or ""
        }
        for c in chunks
    ]

    _collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    logger.info(f"Added {len(chunks)} chunks to ChromaDB for material '{material_id}' (learner: '{learner_id}').")

def query_similar(material_id: str, query_text: str, k: int = 6) -> List[Dict[str, str]]:
    """
    Retrieves top-k similar chunks for a given search query text within a material_id.
    """
    query_vec = embed([query_text])[0]
    
    results = _collection.query(
        query_embeddings=[query_vec],
        n_results=k,
        where={"materialId": material_id}
    )

    chunks: List[Dict[str, str]] = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if "metadatas" in results else []

        for doc, meta in zip(docs, metas):
            chunks.append({
                "chunkId": meta.get("chunkId", ""),
                "text": doc,
                "sourceRef": meta.get("sourceRef", "")
            })

    return chunks

def sample_spread(material_id: str, n: int = 6) -> List[Dict[str, str]]:
    """
    Samples n chunks evenly spaced across the full document indices.
    Fallback when no specific query notes are provided.
    """
    results = _collection.get(
        where={"materialId": material_id},
        include=["documents", "metadatas"]
    )

    if not results or not results["documents"]:
        return []

    docs = results["documents"]
    metas = results["metadatas"]

    all_chunks = []
    for doc, meta in zip(docs, metas):
        all_chunks.append({
            "chunkId": meta.get("chunkId", ""),
            "text": doc,
            "sourceRef": meta.get("sourceRef", "")
        })

    def get_chunk_idx(c):
        try:
            return int(c["chunkId"].split("-")[-1])
        except Exception:
            return 0

    all_chunks.sort(key=get_chunk_idx)
    total_count = len(all_chunks)

    if total_count <= n:
        return all_chunks

    step = total_count / float(n)
    sampled = []
    for i in range(n):
        idx = int(i * step)
        if idx < total_count:
            sampled.append(all_chunks[idx])

    return sampled

def get_chunks_by_ids(material_id: str, chunk_ids: List[str], learner_id: str = None) -> List[Dict[str, str]]:
    """
    Lookup for specific chunkIds belonging to a material_id and verifying learner ownership.
    """
    if not material_id or not chunk_ids:
        return []

    ids_to_fetch = [f"{material_id}_{cid}" for cid in chunk_ids]
    results = _collection.get(
        ids=ids_to_fetch,
        include=["documents", "metadatas"]
    )

    if not results or not results["documents"]:
        return []

    chunks = []
    for doc, meta in zip(results["documents"], results["metadatas"]):
        # Enforce learner ownership check if chunk has an owner
        chunk_owner = meta.get("learnerId")
        if chunk_owner and learner_id and chunk_owner != learner_id:
            logger.warning(f"Unauthorized chunk access attempt: chunk owner '{chunk_owner}' != requester '{learner_id}'")
            continue

        chunks.append({
            "chunkId": meta.get("chunkId", ""),
            "text": doc,
            "sourceRef": meta.get("sourceRef", "")
        })
    return chunks
