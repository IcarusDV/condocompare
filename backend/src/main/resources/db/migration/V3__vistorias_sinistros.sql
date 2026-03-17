-- Migration V3: Vistorias e Sinistros

-- Tabela de Vistorias
CREATE TABLE condocompare.vistorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID NOT NULL REFERENCES condocompare.condominios(id),
    tipo VARCHAR(50) NOT NULL, -- INICIAL, PERIODICA, SINISTRO, RENOVACAO
    status VARCHAR(50) NOT NULL DEFAULT 'AGENDADA', -- AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    data_agendada TIMESTAMP NOT NULL,
    data_realizada TIMESTAMP,
    responsavel_nome VARCHAR(255),
    responsavel_telefone VARCHAR(20),
    responsavel_email VARCHAR(255),
    observacoes TEXT,
    laudo_url VARCHAR(500),
    documento_id UUID REFERENCES condocompare.documentos(id),
    itens_vistoriados JSONB,
    pendencias JSONB,
    nota_geral INTEGER CHECK (nota_geral >= 0 AND nota_geral <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES condocompare.users(id),
    updated_by UUID REFERENCES condocompare.users(id),
    active BOOLEAN DEFAULT true
);

-- Tabela de Sinistros
CREATE TABLE condocompare.sinistros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID NOT NULL REFERENCES condocompare.condominios(id),
    apolice_id UUID REFERENCES condocompare.documentos(id),
    numero_sinistro VARCHAR(100),
    tipo VARCHAR(50) NOT NULL, -- INCENDIO, ROUBO, DANOS_AGUA, DANOS_ELETRICOS, RESPONSABILIDADE_CIVIL, VENDAVAL, OUTROS
    status VARCHAR(50) NOT NULL DEFAULT 'ABERTO', -- ABERTO, EM_ANALISE, APROVADO, NEGADO, PAGO, CANCELADO
    data_ocorrencia TIMESTAMP NOT NULL,
    data_comunicacao TIMESTAMP,
    descricao TEXT NOT NULL,
    local_ocorrencia VARCHAR(255),
    valor_prejuizo DECIMAL(12, 2),
    valor_indenizado DECIMAL(12, 2),
    cobertura_acionada VARCHAR(255),
    documentos_ids UUID[],
    fotos_urls TEXT[],
    historico JSONB, -- Array de eventos com data, descricao, usuario
    seguradora_protocolo VARCHAR(100),
    seguradora_contato VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES condocompare.users(id),
    updated_by UUID REFERENCES condocompare.users(id),
    active BOOLEAN DEFAULT true
);

-- Tabela de Notificacoes
CREATE TABLE condocompare.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES condocompare.users(id),
    tipo VARCHAR(50) NOT NULL, -- VENCIMENTO_APOLICE, VISTORIA_AGENDADA, SINISTRO_ATUALIZADO, DOCUMENTO_PROCESSADO
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP,
    referencia_tipo VARCHAR(50), -- APOLICE, VISTORIA, SINISTRO, DOCUMENTO
    referencia_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- Indices
CREATE INDEX idx_vistorias_condominio ON condocompare.vistorias(condominio_id);
CREATE INDEX idx_vistorias_status ON condocompare.vistorias(status);
CREATE INDEX idx_vistorias_data ON condocompare.vistorias(data_agendada);

CREATE INDEX idx_sinistros_condominio ON condocompare.sinistros(condominio_id);
CREATE INDEX idx_sinistros_status ON condocompare.sinistros(status);
CREATE INDEX idx_sinistros_tipo ON condocompare.sinistros(tipo);
CREATE INDEX idx_sinistros_data ON condocompare.sinistros(data_ocorrencia);

CREATE INDEX idx_notificacoes_user ON condocompare.notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON condocompare.notificacoes(lida);
CREATE INDEX idx_notificacoes_tipo ON condocompare.notificacoes(tipo);

-- Adicionar campo de vencimento na tabela de documentos (apolices)
ALTER TABLE condocompare.documentos ADD COLUMN IF NOT EXISTS notificacao_vencimento_enviada BOOLEAN DEFAULT false;
