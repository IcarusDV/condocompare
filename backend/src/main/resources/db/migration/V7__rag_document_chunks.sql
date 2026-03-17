-- Tabela de chunks de documentos para RAG
CREATE TABLE IF NOT EXISTS condocompare.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID REFERENCES condocompare.documentos(id) ON DELETE CASCADE,
    condominio_id UUID REFERENCES condocompare.condominios(id) ON DELETE SET NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    tipo_documento VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    search_vector TSVECTOR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indice GIN para busca full-text
CREATE INDEX IF NOT EXISTS idx_chunks_search_vector ON condocompare.document_chunks USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_chunks_documento ON condocompare.document_chunks(documento_id);
CREATE INDEX IF NOT EXISTS idx_chunks_condominio ON condocompare.document_chunks(condominio_id);
CREATE INDEX IF NOT EXISTS idx_chunks_tipo ON condocompare.document_chunks(tipo_documento);

-- Funcao para atualizar search_vector automaticamente
CREATE OR REPLACE FUNCTION condocompare.update_chunk_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.chunk_text, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_chunk_search_vector
    BEFORE INSERT OR UPDATE OF chunk_text ON condocompare.document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION condocompare.update_chunk_search_vector();
