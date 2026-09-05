from pydantic import BaseModel

class MaterialUploadResponse(BaseModel):
    materialId: str
    filename: str
    chunkCount: int
