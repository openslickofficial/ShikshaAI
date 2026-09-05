from typing import Dict, Any, Optional

# Module-level in-memory store: materialId -> { materialId, learnerId, filename, chunkCount, createdAt }
material_store: Dict[str, Dict[str, Any]] = {}

def get_material_meta(material_id: str, learner_id: Optional[str] = None) -> Dict[str, Any] | None:
    meta = material_store.get(material_id)
    if not meta:
        return None
    # Strictly enforce learner scoping: if material has an owner, require learner_id to match
    if meta.get("learnerId"):
        if not learner_id or meta.get("learnerId") != learner_id:
            return None
    return meta

def record_material_meta(material_id: str, filename: str, chunk_count: int, learner_id: Optional[str] = None) -> Dict[str, Any]:
    from datetime import datetime
    meta = {
        "materialId": material_id,
        "learnerId": learner_id,
        "filename": filename,
        "chunkCount": chunk_count,
        "createdAt": datetime.utcnow().isoformat()
    }
    material_store[material_id] = meta
    return meta

