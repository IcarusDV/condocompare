-- Tabela de Parceiros
CREATE TABLE IF NOT EXISTS condocompare.parceiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20),
    cpf VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    endereco VARCHAR(500),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    descricao_servicos VARCHAR(2000),
    area_atuacao VARCHAR(500),
    contato_nome VARCHAR(255),
    contato_cargo VARCHAR(100),
    observacoes VARCHAR(2000),
    avaliacao DOUBLE PRECISION,
    total_avaliacoes INTEGER DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Tabela de categorias dos parceiros (ElementCollection)
CREATE TABLE IF NOT EXISTS condocompare.parceiro_categorias (
    parceiro_id UUID NOT NULL REFERENCES condocompare.parceiros(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    PRIMARY KEY (parceiro_id, categoria)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_parceiros_cidade ON condocompare.parceiros(cidade);
CREATE INDEX IF NOT EXISTS idx_parceiros_estado ON condocompare.parceiros(estado);
CREATE INDEX IF NOT EXISTS idx_parceiros_ativo ON condocompare.parceiros(ativo);
CREATE INDEX IF NOT EXISTS idx_parceiros_avaliacao ON condocompare.parceiros(avaliacao);
CREATE INDEX IF NOT EXISTS idx_parceiro_categorias_cat ON condocompare.parceiro_categorias(categoria);
