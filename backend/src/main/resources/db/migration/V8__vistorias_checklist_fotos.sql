-- Itens de checklist da vistoria
CREATE TABLE IF NOT EXISTS condocompare.vistoria_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vistoria_id UUID NOT NULL REFERENCES condocompare.vistorias(id) ON DELETE CASCADE,
    categoria VARCHAR(100) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    severidade VARCHAR(20) DEFAULT 'BAIXA',
    observacao TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fotos da vistoria
CREATE TABLE IF NOT EXISTS condocompare.vistoria_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vistoria_id UUID NOT NULL REFERENCES condocompare.vistorias(id) ON DELETE CASCADE,
    vistoria_item_id UUID REFERENCES condocompare.vistoria_itens(id) ON DELETE SET NULL,
    url VARCHAR(500) NOT NULL,
    descricao VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_vistoria_itens_vistoria ON condocompare.vistoria_itens(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_fotos_vistoria ON condocompare.vistoria_fotos(vistoria_id);

-- Adicionar campo de laudo na vistoria
ALTER TABLE condocompare.vistorias ADD COLUMN IF NOT EXISTS laudo_texto TEXT;
ALTER TABLE condocompare.vistorias ADD COLUMN IF NOT EXISTS laudo_gerado_em TIMESTAMP;
ALTER TABLE condocompare.vistorias ADD COLUMN IF NOT EXISTS total_itens INTEGER DEFAULT 0;
ALTER TABLE condocompare.vistorias ADD COLUMN IF NOT EXISTS itens_conformes INTEGER DEFAULT 0;
ALTER TABLE condocompare.vistorias ADD COLUMN IF NOT EXISTS itens_nao_conformes INTEGER DEFAULT 0;
