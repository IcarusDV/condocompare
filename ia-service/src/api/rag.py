"""RAG API endpoints for document indexing and querying"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID

from pypdf import PdfReader
import io
import json
import logging

from src.rag.chunker import chunk_document
from src.rag.store import store_chunks, search_chunks, delete_chunks_by_documento, get_chunk_stats
from src.services.llm import chat_completion

logger = logging.getLogger(__name__)

router = APIRouter()


class IndexDocumentRequest(BaseModel):
    documento_id: str
    condominio_id: Optional[str] = None
    tipo_documento: str = "OUTRO"
    texto: str
    metadata: Dict[str, Any] = {}


class IndexDocumentResponse(BaseModel):
    documento_id: str
    chunks_created: int
    success: bool
    message: str


class SearchRequest(BaseModel):
    query: str
    condominio_id: Optional[str] = None
    tipo_documento: Optional[str] = None
    limit: int = 8
    score_minimo: float = 0.01


class SearchResult(BaseModel):
    chunk_text: str
    headline: Optional[str] = None
    documento_id: Optional[str] = None
    tipo_documento: Optional[str] = None
    relevance: float = 0.0


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


class AskRequest(BaseModel):
    question: str
    condominio_id: Optional[str] = None
    tipo_documento: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    sources: List[SearchResult]
    context_used: bool


@router.post("/index", response_model=IndexDocumentResponse)
async def index_document(request: IndexDocumentRequest):
    """Index a document text for RAG retrieval."""
    try:
        if not request.texto.strip():
            raise HTTPException(status_code=400, detail="Texto vazio")

        # Delete existing chunks for this document (re-index)
        delete_chunks_by_documento(request.documento_id)

        # Chunk the document
        chunks = chunk_document(
            text=request.texto,
            documento_id=request.documento_id,
            condominio_id=request.condominio_id,
            tipo_documento=request.tipo_documento,
            metadata=request.metadata,
        )

        # Store chunks
        count = store_chunks(chunks)

        return IndexDocumentResponse(
            documento_id=request.documento_id,
            chunks_created=count,
            success=True,
            message=f"{count} chunks indexados com sucesso",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao indexar documento: {str(e)}")


@router.post("/index-pdf", response_model=IndexDocumentResponse)
async def index_pdf(
    file: UploadFile = File(...),
    documento_id: str = "",
    condominio_id: Optional[str] = None,
    tipo_documento: str = "OUTRO",
):
    """Upload and index a PDF document."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDFs sao suportados")

    try:
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))
        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        full_text = "\n".join(text_parts)
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Nao foi possivel extrair texto do PDF")

        if not documento_id:
            from uuid import uuid4
            documento_id = str(uuid4())

        # Delete existing and re-index
        delete_chunks_by_documento(documento_id)

        chunks = chunk_document(
            text=full_text,
            documento_id=documento_id,
            condominio_id=condominio_id,
            tipo_documento=tipo_documento,
            metadata={"filename": file.filename, "pages": len(pdf_reader.pages)},
        )

        count = store_chunks(chunks)

        return IndexDocumentResponse(
            documento_id=documento_id,
            chunks_created=count,
            success=True,
            message=f"{count} chunks indexados de {file.filename}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao indexar PDF: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search indexed documents with hybrid ranking and highlighted snippets."""
    try:
        results = search_chunks(
            query=request.query,
            condominio_id=request.condominio_id,
            tipo_documento=request.tipo_documento,
            limit=request.limit,
            score_minimo=request.score_minimo,
        )

        search_results = [
            SearchResult(
                chunk_text=r["chunk_text"],
                headline=r.get("headline"),
                documento_id=str(r["documento_id"]) if r.get("documento_id") else None,
                tipo_documento=r.get("tipo_documento"),
                relevance=float(r.get("relevance", 0)),
            )
            for r in results
        ]

        return SearchResponse(
            query=request.query,
            results=search_results,
            total=len(search_results),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}")


@router.post("/ask", response_model=AskResponse)
async def ask_with_context(request: AskRequest):
    """Ask a question using RAG context from indexed documents."""
    try:
        # Search for relevant chunks with improved ranking
        results = search_chunks(
            query=request.question,
            condominio_id=request.condominio_id,
            tipo_documento=request.tipo_documento,
            limit=8,
            score_minimo=0.01,
        )

        context_used = len(results) > 0

        # Build context from results, using headline when available
        context_parts = []
        for r in results:
            tipo = r.get("tipo_documento", "OUTRO")
            text = r.get("headline") or r["chunk_text"]
            context_parts.append(f"[{tipo}] {text}")

        context = "\n\n---\n\n".join(context_parts) if context_parts else ""

        # Build prompt with context
        if context:
            prompt = f"""Baseado nos seguintes trechos de documentos de seguro do condominio, responda a pergunta do usuario.

CONTEXTO DOS DOCUMENTOS:
{context}

PERGUNTA: {request.question}

Instrucoes:
- Responda baseado no contexto fornecido
- Se a informacao nao estiver no contexto, diga que nao encontrou nos documentos indexados
- Cite trechos relevantes quando possivel
- Responda em portugues brasileiro"""
        else:
            prompt = f"""O usuario fez a seguinte pergunta, mas nao foram encontrados documentos relevantes indexados:

PERGUNTA: {request.question}

Responda com base no seu conhecimento geral sobre seguros de condominio, mas mencione que nao foram encontrados documentos indexados relevantes."""

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1500,
        )

        sources = [
            SearchResult(
                chunk_text=r["chunk_text"][:200] + "...",
                headline=r.get("headline"),
                documento_id=str(r["documento_id"]) if r.get("documento_id") else None,
                tipo_documento=r.get("tipo_documento"),
                relevance=float(r.get("relevance", 0)),
            )
            for r in results
        ]

        return AskResponse(
            answer=response,
            sources=sources,
            context_used=context_used,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao responder: {str(e)}")


class IndexAndExtractRequest(BaseModel):
    documento_id: str
    condominio_id: Optional[str] = None
    tipo_documento: str = "OUTRO"
    texto: str
    metadata: Dict[str, Any] = {}


class IndexAndExtractResponse(BaseModel):
    documento_id: str
    chunks_created: int
    dados_extraidos: Dict[str, Any]
    tipo_classificado: Optional[str] = None
    confianca_classificacao: Optional[float] = None
    success: bool
    message: str


@router.post("/index-and-extract", response_model=IndexAndExtractResponse)
async def index_and_extract(request: IndexAndExtractRequest):
    """
    Pipeline completo: indexa documento no RAG (se possivel) e extrai dados via Claude.
    A extracao Claude SEMPRE roda, mesmo se o DB estiver offline.
    """
    if not request.texto.strip():
        raise HTTPException(status_code=400, detail="Texto vazio")

    # ===== STEP 1: RAG INDEXING (best-effort, never blocks extraction) =====
    chunks_count = 0
    try:
        delete_chunks_by_documento(request.documento_id)
        chunks = chunk_document(
            text=request.texto,
            documento_id=request.documento_id,
            condominio_id=request.condominio_id,
            tipo_documento=request.tipo_documento,
            metadata=request.metadata,
        )
        chunks_count = store_chunks(chunks)
        logger.info(f"RAG indexing OK: doc={request.documento_id}, chunks={chunks_count}")
    except Exception as e:
        logger.warning(f"RAG indexing failed (skipping, will still extract): {type(e).__name__}: {e}")

    # ===== STEP 2: CLAUDE EXTRACTION (must always run) =====
    from src.api.documents import EXTRACTION_PROMPT_ORCAMENTO

    dados_extraidos: Dict[str, Any] = {}
    raw_response = ""

    try:
        texto_truncado = request.texto[:80000]
        prompt = EXTRACTION_PROMPT_ORCAMENTO.format(texto=texto_truncado)

        logger.info(f"Calling Claude: doc={request.documento_id}, tipo={request.tipo_documento}, text_len={len(texto_truncado)}")

        raw_response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=4000,
        )

        logger.info(f"Claude responded: {len(raw_response)} chars")

        json_str = raw_response.strip()
        if json_str.startswith("```json"):
            json_str = json_str[7:]
        elif json_str.startswith("```"):
            json_str = json_str[3:]
        if json_str.endswith("```"):
            json_str = json_str[:-3]
        dados_extraidos = json.loads(json_str.strip())

        # Move dadosImovel -> condominio_data for frontend compatibility
        if "dadosImovel" in dados_extraidos:
            dados_extraidos["condominio_data"] = dados_extraidos.pop("dadosImovel")

        logger.info(f"Extraction SUCCESS: doc={request.documento_id}, fields={list(dados_extraidos.keys())}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error. Raw response: {raw_response[:2000]}")
        dados_extraidos = {"erro": f"JSON inválido: {str(e)}", "raw": raw_response[:500]}
    except Exception as e:
        logger.error(f"Claude extraction failed: {type(e).__name__}: {e}", exc_info=True)
        dados_extraidos = {"erro": f"Falha na extração: {type(e).__name__}: {str(e)}"}

    return IndexAndExtractResponse(
        documento_id=request.documento_id,
        chunks_created=chunks_count,
        dados_extraidos=dados_extraidos,
        tipo_classificado=request.tipo_documento,
        success=True,
        message=f"{chunks_count} chunks indexados, {len(dados_extraidos)} campos extraidos",
    )


@router.delete("/document/{documento_id}")
async def delete_document_index(documento_id: str):
    """Delete all indexed chunks for a document."""
    try:
        count = delete_chunks_by_documento(documento_id)
        return {"deleted": count, "documento_id": documento_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar: {str(e)}")


@router.get("/stats")
async def rag_stats():
    """Get RAG system statistics."""
    try:
        stats = get_chunk_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter stats: {str(e)}")
