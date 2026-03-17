-- Tabela de Planos
CREATE TABLE IF NOT EXISTS condocompare.planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    preco_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
    preco_anual DECIMAL(10,2),
    max_condominios INTEGER DEFAULT 1,
    max_documentos_mes INTEGER DEFAULT 10,
    max_usuarios INTEGER DEFAULT 2,
    tem_diagnostico BOOLEAN DEFAULT FALSE,
    tem_assistente_ia BOOLEAN DEFAULT FALSE,
    tem_rag BOOLEAN DEFAULT FALSE,
    tem_vistoria_completa BOOLEAN DEFAULT FALSE,
    tem_laudo_tecnico BOOLEAN DEFAULT FALSE,
    tem_parceiros BOOLEAN DEFAULT FALSE,
    tem_relatorios_avancados BOOLEAN DEFAULT FALSE,
    tem_api_acesso BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    destaque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS condocompare.assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES condocompare.users(id),
    plano_id UUID NOT NULL REFERENCES condocompare.planos(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVA',
    data_inicio DATE NOT NULL,
    data_fim DATE,
    data_cancelamento DATE,
    tipo_pagamento VARCHAR(50) DEFAULT 'MENSAL',
    valor DECIMAL(10,2) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON condocompare.assinaturas(user_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_plano ON condocompare.assinaturas(plano_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON condocompare.assinaturas(status);

-- Inserir planos padrao
INSERT INTO condocompare.planos (nome, codigo, descricao, preco_mensal, preco_anual, max_condominios, max_documentos_mes, max_usuarios, tem_diagnostico, tem_assistente_ia, tem_rag, tem_vistoria_completa, tem_laudo_tecnico, tem_parceiros, tem_relatorios_avancados, tem_api_acesso, ordem, destaque)
VALUES
    ('Gratuito', 'FREE', 'Ideal para conhecer a plataforma. Funcionalidades basicas para um condominio.', 0, 0, 1, 5, 1, false, false, false, false, false, false, false, false, 1, false),
    ('Basico', 'BASIC', 'Para sindicos e pequenas administradoras. Recursos essenciais para gestao de seguro.', 99.90, 999.00, 5, 30, 3, true, true, false, false, false, true, false, false, 2, false),
    ('Profissional', 'PRO', 'Para administradoras e corretoras. Todas as ferramentas para gestao completa.', 249.90, 2499.00, 20, 100, 10, true, true, true, true, true, true, true, false, 3, true),
    ('Enterprise', 'ENTERPRISE', 'Para grandes operacoes. Recursos ilimitados, API e suporte dedicado.', 599.90, 5999.00, 999, 9999, 50, true, true, true, true, true, true, true, true, 4, false)
ON CONFLICT (codigo) DO NOTHING;
