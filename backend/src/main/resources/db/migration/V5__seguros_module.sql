-- Tabela de Seguradoras
CREATE TABLE IF NOT EXISTS condocompare.seguradoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    codigo_susep VARCHAR(50),
    telefone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    endereco_completo TEXT,
    logo_url VARCHAR(500),
    observacoes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Tabela de Apólices
CREATE TABLE IF NOT EXISTS condocompare.apolices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_apolice VARCHAR(100) NOT NULL,
    condominio_id UUID NOT NULL REFERENCES condocompare.condominios(id),
    seguradora_id UUID NOT NULL REFERENCES condocompare.seguradoras(id),
    status VARCHAR(50) NOT NULL DEFAULT 'VIGENTE',
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    premio_total DECIMAL(15, 2),
    premio_liquido DECIMAL(15, 2),
    iof DECIMAL(15, 2),
    forma_pagamento VARCHAR(100),
    numero_parcelas INTEGER,
    valor_parcela DECIMAL(15, 2),
    importancia_segurada_total DECIMAL(15, 2),
    documento_id UUID,
    proposta_id UUID,
    corretor_nome VARCHAR(255),
    corretor_susep VARCHAR(50),
    corretor_telefone VARCHAR(20),
    corretor_email VARCHAR(255),
    observacoes TEXT,
    clausulas_especiais TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Tabela de Coberturas
CREATE TABLE IF NOT EXISTS condocompare.coberturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apolice_id UUID NOT NULL REFERENCES condocompare.apolices(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    limite_maximo DECIMAL(15, 2),
    franquia DECIMAL(15, 2),
    franquia_percentual DECIMAL(5, 2),
    carencia_dias INTEGER,
    condicoes_especiais TEXT,
    exclusoes TEXT,
    contratada BOOLEAN NOT NULL DEFAULT TRUE,
    obrigatoria BOOLEAN NOT NULL DEFAULT FALSE,
    recomendada BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_apolices_condominio ON condocompare.apolices(condominio_id);
CREATE INDEX IF NOT EXISTS idx_apolices_seguradora ON condocompare.apolices(seguradora_id);
CREATE INDEX IF NOT EXISTS idx_apolices_status ON condocompare.apolices(status);
CREATE INDEX IF NOT EXISTS idx_apolices_data_fim ON condocompare.apolices(data_fim);
CREATE INDEX IF NOT EXISTS idx_coberturas_apolice ON condocompare.coberturas(apolice_id);
CREATE INDEX IF NOT EXISTS idx_coberturas_tipo ON condocompare.coberturas(tipo);

-- Inserir algumas seguradoras padrão
INSERT INTO condocompare.seguradoras (nome, cnpj, codigo_susep) VALUES
    ('Porto Seguro', '61.198.164/0001-60', '0318'),
    ('Tokio Marine', '33.164.021/0001-00', '0341'),
    ('Bradesco Seguros', '92.682.038/0001-00', '0530'),
    ('SulAmérica', '33.041.062/0001-09', '0528'),
    ('Allianz', '61.573.796/0001-66', '0671'),
    ('Liberty Seguros', '61.550.141/0001-72', '0665'),
    ('Mapfre', '61.074.175/0001-38', '0197'),
    ('HDI Seguros', '29.980.158/0001-57', '5819'),
    ('Zurich', '17.197.385/0001-21', '0598'),
    ('Chubb', '33.170.085/0001-05', '0655')
ON CONFLICT (cnpj) DO NOTHING;
