"""Document chunker for RAG system"""

from typing import List, Dict, Any
import re


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks."""
    if not text or not text.strip():
        return []

    # Clean text
    text = re.sub(r'\s+', ' ', text).strip()

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < len(text):
            # Look for period, newline, or other sentence boundary
            for sep in ['. ', '.\n', '\n\n', '\n', '; ', ', ']:
                last_sep = text[start:end].rfind(sep)
                if last_sep > chunk_size * 0.5:
                    end = start + last_sep + len(sep)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap
        if start >= len(text):
            break

    return chunks


def chunk_document(
    text: str,
    documento_id: str,
    condominio_id: str | None = None,
    tipo_documento: str = "OUTRO",
    metadata: Dict[str, Any] | None = None,
) -> List[Dict[str, Any]]:
    """Chunk a document and return chunk records."""
    chunks = chunk_text(text)

    records = []
    for i, chunk in enumerate(chunks):
        record = {
            "documento_id": documento_id,
            "condominio_id": condominio_id,
            "chunk_text": chunk,
            "chunk_index": i,
            "tipo_documento": tipo_documento,
            "metadata": metadata or {},
        }
        records.append(record)

    return records
