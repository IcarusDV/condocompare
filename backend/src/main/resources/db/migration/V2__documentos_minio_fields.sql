-- V2: Add MinIO storage fields and insurance data to documentos table

-- Rename storage_path to nome_arquivo_storage for consistency
ALTER TABLE condocompare.documentos
    RENAME COLUMN storage_path TO nome_arquivo_storage;

-- Add MinIO specific fields
ALTER TABLE condocompare.documentos
    ADD COLUMN bucket_name VARCHAR(255),
    ADD COLUMN object_key VARCHAR(500);

-- Add processing error field
ALTER TABLE condocompare.documentos
    ADD COLUMN erro_processamento TEXT;

-- Add insurance-related fields for processed documents
ALTER TABLE condocompare.documentos
    ADD COLUMN seguradora_nome VARCHAR(255),
    ADD COLUMN valor_premio DECIMAL(12, 2),
    ADD COLUMN data_vigencia_inicio DATE,
    ADD COLUMN data_vigencia_fim DATE;

-- Add observacoes field
ALTER TABLE condocompare.documentos
    ADD COLUMN observacoes TEXT;

-- Update object_key with existing storage path data
UPDATE condocompare.documentos
SET object_key = nome_arquivo_storage
WHERE object_key IS NULL;

-- Create index on seguradora
CREATE INDEX idx_documentos_seguradora ON condocompare.documentos(seguradora_nome);
