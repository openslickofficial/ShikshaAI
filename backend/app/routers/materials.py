import uuid
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.deps import get_current_learner
from app.models.db_models import LearnerProfile
from app.schemas.material import MaterialUploadResponse
from app.services.document_parser import extract_text, ParsingError
from app.services.chunker import chunk_blocks
from app.services.embeddings import embed, EmbeddingError
from app.services.vector_store import add_material
from app.services.material_store import record_material_meta
from app.services.rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/materials", tags=["materials"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

ALLOWED_EXTENSIONS = ('.pdf', '.docx', '.pptx')

@router.post("/upload", response_model=MaterialUploadResponse, dependencies=[Depends(check_rate_limit)])
async def upload_material(
    file: UploadFile = File(...),
    learner: LearnerProfile = Depends(get_current_learner)
):
    """
    Accepts multipart file upload (.pdf, .docx, .pptx).
    Parses, chunks, generates embeddings, stores in ChromaDB, and returns material metadata.
    """
    filename = file.filename or "uploaded_document"
    fn_lower = filename.lower()

    if not fn_lower.endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{filename}'. Allowed formats: .pdf, .docx, .pptx"
        )

    # Read bytes and check size
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{filename}' is empty."
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of 20MB."
        )

    material_id = f"mat-{uuid.uuid4().hex[:12]}"
    content_type = file.content_type or ""

    try:
        # 1. Parse Document Text Blocks
        blocks = extract_text(file_bytes, content_type, filename)

        # 2. Chunk Text Blocks
        chunks = chunk_blocks(blocks)
        if not chunks:
            raise ParsingError("Could not divide document text into valid sections.")

        # 3. Generate Vector Embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embed(chunk_texts)

        # 4. Save into Persistent Vector Store (ChromaDB) with learner ownership
        add_material(material_id, chunks, embeddings, learner_id=learner.learnerId)

        # 5. Record Ephemeral Store Metadata tied to uploading learnerId
        meta = record_material_meta(material_id, filename, len(chunks), learner_id=learner.learnerId)

        return MaterialUploadResponse(
            materialId=material_id,
            filename=filename,
            chunkCount=len(chunks)
        )

    except ParsingError as pe:
        logger.warning(f"Parsing error for uploaded file '{filename}': {pe.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=pe.message
        )
    except EmbeddingError as ee:
        logger.error(f"Embedding error for file '{filename}': {ee.message}")
        raise HTTPException(
            status_code=ee.status_code,
            detail=ee.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing material '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process material document. Please verify file format and try again."
        )
