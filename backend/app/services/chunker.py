from typing import List, Dict

TARGET_CHUNK_SIZE = 600
CHUNK_OVERLAP = 100

def chunk_blocks(blocks: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Chunks extracted text blocks using a ~600-char sliding window with ~100-char overlap.
    Preserves sourceRef metadata (page/slide number).
    Returns list of dicts: [{"chunkId": "chk-0", "text": "...", "sourceRef": "Page 1"}]
    """
    chunks: List[Dict[str, str]] = []
    chunk_counter = 0

    for block in blocks:
        text = block.get("text", "").strip()
        source_ref = block.get("sourceRef", "Document")

        if not text:
            continue

        # If text is smaller than target chunk size, keep as single chunk
        if len(text) <= TARGET_CHUNK_SIZE:
            chunks.append({
                "chunkId": f"chk-{chunk_counter}",
                "text": text,
                "sourceRef": source_ref
            })
            chunk_counter += 1
            continue

        # Sliding window chunking
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + TARGET_CHUNK_SIZE, text_len)

            # Try to break at a newline or period if possible near the end boundary
            if end < text_len:
                break_point = text.rfind(". ", start + TARGET_CHUNK_SIZE - 150, end)
                if break_point == -1:
                    break_point = text.rfind("\n", start + TARGET_CHUNK_SIZE - 150, end)
                if break_point != -1 and break_point > start:
                    end = break_point + 1

            chunk_str = text[start:end].strip()
            if chunk_str:
                chunks.append({
                    "chunkId": f"chk-{chunk_counter}",
                    "text": chunk_str,
                    "sourceRef": source_ref
                })
                chunk_counter += 1

            # Advance window by TARGET_CHUNK_SIZE - CHUNK_OVERLAP
            if end >= text_len:
                break
            start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks
