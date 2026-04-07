"""Vector store using PostgreSQL full-text search for RAG"""

import json
from typing import List, Dict, Any, Optional
from uuid import uuid4

import psycopg2
from psycopg2.extras import RealDictCursor, Json

from src.config import settings


def get_connection():
    """Get PostgreSQL connection."""
    url = settings.postgres_url
    return psycopg2.connect(url)


def store_chunks(chunks: List[Dict[str, Any]]) -> int:
    """Store document chunks in PostgreSQL."""
    if not chunks:
        return 0

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for chunk in chunks:
                cur.execute(
                    """
                    INSERT INTO condocompare.document_chunks
                        (id, documento_id, condominio_id, chunk_text, chunk_index, tipo_documento, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        str(uuid4()),
                        chunk.get("documento_id"),
                        chunk.get("condominio_id"),
                        chunk["chunk_text"],
                        chunk.get("chunk_index", 0),
                        chunk.get("tipo_documento", "OUTRO"),
                        Json(chunk.get("metadata", {})),
                    ),
                )
            conn.commit()
        return len(chunks)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def search_chunks(
    query: str,
    condominio_id: Optional[str] = None,
    tipo_documento: Optional[str] = None,
    limit: int = 8,
    score_minimo: float = 0.01,
) -> List[Dict[str, Any]]:
    """Search chunks using PostgreSQL full-text search with hybrid ranking and headlines."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build the query with optional filters
            where_clauses = ["search_vector @@ plainto_tsquery('portuguese', %s)"]
            params: list = [query]

            if condominio_id:
                where_clauses.append("condominio_id = %s")
                params.append(condominio_id)

            if tipo_documento:
                where_clauses.append("tipo_documento = %s")
                params.append(tipo_documento)

            where_sql = " AND ".join(where_clauses)

            # Weighted ranking: tipo_documento priority (apolice > orcamento > others)
            # ts_rank_cd uses cover density for better relevance
            # ts_headline provides context-highlighted snippets
            cur.execute(
                f"""
                SELECT
                    id, documento_id, condominio_id, chunk_text, chunk_index,
                    tipo_documento, metadata,
                    (
                        ts_rank_cd(search_vector, plainto_tsquery('portuguese', %s), 32) *
                        CASE tipo_documento
                            WHEN 'APOLICE' THEN 1.5
                            WHEN 'ORCAMENTO' THEN 1.3
                            WHEN 'CONDICOES_GERAIS' THEN 1.2
                            WHEN 'LAUDO_VISTORIA' THEN 1.1
                            ELSE 1.0
                        END
                    ) as relevance,
                    ts_headline(
                        'portuguese',
                        chunk_text,
                        plainto_tsquery('portuguese', %s),
                        'StartSel=**, StopSel=**, MaxWords=60, MinWords=20, MaxFragments=2, FragmentDelimiter= ... '
                    ) as headline
                FROM condocompare.document_chunks
                WHERE {where_sql}
                ORDER BY relevance DESC
                LIMIT %s
                """,
                [query, query] + params + [limit],
            )
            results = cur.fetchall()

            # Filter by minimum score
            filtered = [dict(r) for r in results if float(r.get("relevance", 0)) >= score_minimo]
            return filtered
    finally:
        conn.close()


def delete_chunks_by_documento(documento_id: str) -> int:
    """Delete all chunks for a document."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM condocompare.document_chunks WHERE documento_id = %s",
                (documento_id,),
            )
            count = cur.rowcount
            conn.commit()
            return count
    finally:
        conn.close()


def get_seguradora_knowledge(seguradora_nome: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch seguradora knowledge (especialidades, regras, ia_conhecimento) from the database."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if seguradora_nome:
                cur.execute(
                    """
                    SELECT nome, especialidades, regras, ia_conhecimento, descricao
                    FROM condocompare.seguradoras
                    WHERE active = TRUE AND LOWER(nome) LIKE %s
                    """,
                    (f"%{seguradora_nome.lower()}%",),
                )
            else:
                cur.execute(
                    """
                    SELECT nome, especialidades, regras, ia_conhecimento, descricao
                    FROM condocompare.seguradoras
                    WHERE active = TRUE
                    ORDER BY nome
                    """
                )
            results = cur.fetchall()
            return [dict(r) for r in results]
    except Exception:
        return []
    finally:
        conn.close()


def get_chunk_stats() -> Dict[str, Any]:
    """Get statistics about stored chunks."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    COUNT(*) as total_chunks,
                    COUNT(DISTINCT documento_id) as total_documents,
                    COUNT(DISTINCT condominio_id) as total_condominios
                FROM condocompare.document_chunks
            """)
            stats = dict(cur.fetchone())

            cur.execute("""
                SELECT tipo_documento, COUNT(*) as count
                FROM condocompare.document_chunks
                GROUP BY tipo_documento
                ORDER BY count DESC
            """)
            stats["by_type"] = [dict(r) for r in cur.fetchall()]
            return stats
    finally:
        conn.close()
