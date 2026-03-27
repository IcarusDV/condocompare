-- CondoCompare - Consolidated Initial Schema
-- All tables in their final form (merged from V1-V17)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create schema
CREATE SCHEMA IF NOT EXISTS condocompare;

-- ===========================================
-- Users Table
-- ===========================================
CREATE TABLE condocompare.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    organization_id UUID,
    organization_name VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_users_email ON condocompare.users(email);
CREATE INDEX idx_users_role ON condocompare.users(role);
CREATE INDEX idx_users_organization ON condocompare.users(organization_id);
CREATE INDEX idx_users_active ON condocompare.users(active);
CREATE INDEX idx_users_email_active ON condocompare.users(email, active) WHERE active = true;

-- ===========================================
-- User Permissions Table
-- ===========================================
CREATE TABLE condocompare.user_permissions (
    user_id UUID NOT NULL REFERENCES condocompare.users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, permission)
);

-- ===========================================
-- Condominios Table
-- ===========================================
CREATE TABLE condocompare.condominios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    endereco VARCHAR(500) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    area_construida DECIMAL(12, 2),
    area_total DECIMAL(12, 2),
    numero_unidades INTEGER,
    numero_blocos INTEGER,
    numero_elevadores INTEGER,
    numero_andares INTEGER,
    numero_funcionarios INTEGER,
    ano_construcao INTEGER,
    tem_placas_solares BOOLEAN DEFAULT FALSE,
    tem_piscina BOOLEAN DEFAULT FALSE,
    tem_academia BOOLEAN DEFAULT FALSE,
    tem_salao_festas BOOLEAN DEFAULT FALSE,
    tem_playground BOOLEAN DEFAULT FALSE,
    tem_churrasqueira BOOLEAN DEFAULT FALSE,
    tem_quadra BOOLEAN DEFAULT FALSE,
    tem_portaria_24h BOOLEAN DEFAULT FALSE,
    tipo_construcao VARCHAR(50),
    administradora_id UUID,
    administradora_nome VARCHAR(255),
    sindico_id UUID,
    sindico_nome VARCHAR(255),
    sindico_email VARCHAR(255),
    sindico_telefone VARCHAR(20),
    vencimento_apolice DATE,
    seguradora_atual VARCHAR(255),
    observacoes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_condominios_cnpj ON condocompare.condominios(cnpj);
CREATE INDEX idx_condominios_administradora ON condocompare.condominios(administradora_id);
CREATE INDEX idx_condominios_sindico ON condocompare.condominios(sindico_id);
CREATE INDEX idx_condominios_vencimento ON condocompare.condominios(vencimento_apolice);
CREATE INDEX idx_condominios_active ON condocompare.condominios(active);
CREATE INDEX idx_condominios_active_estado ON condocompare.condominios(active, estado) WHERE active = true;

-- ===========================================
-- Documentos Table
-- (V1 base + V2 MinIO/insurance fields + V3 notificacao_vencimento_enviada)
-- ===========================================
CREATE TABLE condocompare.documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID REFERENCES condocompare.condominios(id),
    tipo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    tamanho_bytes BIGINT,
    nome_arquivo_storage VARCHAR(1000) NOT NULL,
    bucket_name VARCHAR(255),
    object_key VARCHAR(500),
    status VARCHAR(50) DEFAULT 'PENDENTE',
    dados_extraidos JSONB,
    erro_processamento TEXT,
    seguradora_nome VARCHAR(255),
    valor_premio DECIMAL(12, 2),
    data_vigencia_inicio DATE,
    data_vigencia_fim DATE,
    observacoes TEXT,
    notificacao_vencimento_enviada BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_documentos_condominio ON condocompare.documentos(condominio_id);
CREATE INDEX idx_documentos_tipo ON condocompare.documentos(tipo);
CREATE INDEX idx_documentos_status ON condocompare.documentos(status);
CREATE INDEX idx_documentos_seguradora ON condocompare.documentos(seguradora_nome);
CREATE INDEX idx_documentos_active ON condocompare.documentos(active);
CREATE INDEX idx_documentos_condominio_active ON condocompare.documentos(condominio_id, active) WHERE active = true;
CREATE INDEX idx_documentos_tipo_active ON condocompare.documentos(tipo, active) WHERE active = true;
CREATE INDEX idx_documentos_condominio_tipo_active ON condocompare.documentos(condominio_id, tipo, active) WHERE active = true;

-- ===========================================
-- Document Embeddings Table (for RAG - vector)
-- ===========================================
CREATE TABLE condocompare.document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES condocompare.documentos(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embeddings_documento ON condocompare.document_embeddings(documento_id);

-- ===========================================
-- Document Chunks Table (for RAG - tsvector full-text search)
-- ===========================================
CREATE TABLE condocompare.document_chunks (
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

CREATE INDEX idx_chunks_search_vector ON condocompare.document_chunks USING GIN (search_vector);
CREATE INDEX idx_chunks_documento ON condocompare.document_chunks(documento_id);
CREATE INDEX idx_chunks_condominio ON condocompare.document_chunks(condominio_id);
CREATE INDEX idx_chunks_tipo ON condocompare.document_chunks(tipo_documento);

-- Function to auto-update search_vector
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

-- ===========================================
-- Audit Log Table
-- ===========================================
CREATE TABLE condocompare.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON condocompare.audit_log(user_id);
CREATE INDEX idx_audit_entity ON condocompare.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON condocompare.audit_log(created_at);

-- ===========================================
-- Seguradoras Table
-- ===========================================
CREATE TABLE condocompare.seguradoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    codigo_susep VARCHAR(50),
    telefone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    endereco_completo TEXT,
    logo_url VARCHAR(500),
    descricao TEXT,
    especialidades TEXT[],
    regras TEXT[],
    ia_conhecimento TEXT[],
    rating NUMERIC(3,2) DEFAULT 0.0,
    total_avaliacoes INTEGER DEFAULT 0,
    observacoes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Insert seed seguradoras with full detail data
INSERT INTO condocompare.seguradoras (nome, cnpj, codigo_susep, descricao, especialidades, regras, ia_conhecimento) VALUES
    ('Porto Seguro', '61.198.164/0001-60', '0318',
     'Maior seguradora do Brasil em seguros patrimoniais. Referencia em seguro condominio com ampla rede de assistencia 24h e coberturas customizaveis.',
     ARRAY['Seguro Condominio', 'Assistencia 24h', 'Cobertura Ampla', 'Grandes Riscos'],
     ARRAY['Exige vistoria previa para condominios acima de 100 unidades', 'Franquia diferenciada para sinistros de agua', 'Cobertura de vidros apenas na modalidade completa', 'Desconto progressivo por tempo sem sinistro'],
     ARRAY['Condicoes gerais atualizadas', 'Tabela de franquias por tipo de sinistro', 'Regras de aceitacao por perfil de condominio', 'Clausulas de exclusao mais comuns']),
    ('Tokio Marine', '33.164.021/0001-00', '0341',
     'Seguradora japonesa com forte presenca no Brasil. Conhecida pela agilidade na regulacao de sinistros e produtos flexiveis para condominios de todos os portes.',
     ARRAY['Regulacao Agil', 'Condominios PME', 'Flexibilidade', 'Prevencao de Riscos'],
     ARRAY['Aceita condominios sem vistoria ate 50 unidades', 'Franquia unica para todos os tipos de sinistro', 'Cobertura de responsabilidade civil inclusa no basico', 'Bonus de renovacao de ate 15%'],
     ARRAY['Produtos disponiveis por regiao', 'Clausulas especificas para condominios verticais', 'Procedimentos de sinistro passo a passo', 'Comparativo de planos basico vs completo']),
    ('Bradesco Seguros', '92.682.038/0001-00', '0530',
     'Uma das maiores seguradoras do pais, com forte integracao bancaria. Facilidade de pagamento e ampla rede de atendimento para condominios.',
     ARRAY['Integracao Bancaria', 'Parcelamento Facilitado', 'Rede Ampla', 'Seguro Compreensivo'],
     ARRAY['Desconto para clientes Bradesco correntistas', 'Franquia reduzida na renovacao sem sinistro', 'Cobertura de incendio obrigatoria como base', 'Vistoria exigida para importancia segurada acima de R$ 5M'],
     ARRAY['Condicoes especiais para correntistas', 'Estrutura de coberturas e sublimites', 'Processo de acionamento de sinistro', 'Prazos e documentacao necessaria']),
    ('SulAmerica', '33.041.062/0001-09', '0528',
     'Tradicao centenaria no mercado de seguros brasileiro. Destaque em atendimento humanizado e solucoes integradas de saude e patrimonial para condominios.',
     ARRAY['Atendimento Humanizado', 'Solucoes Integradas', 'Experiencia Centenaria', 'Saude + Patrimonial'],
     ARRAY['Pacote basico ja inclui responsabilidade civil do sindico', 'Franquia diferenciada por faixa de importancia segurada', 'Exige extintores e AVCB em dia', 'Desconto de 10% para condominios com CIPA'],
     ARRAY['Pacotes pre-configurados por porte', 'Regras de aceitacao e restricoes', 'Coberturas obrigatorias vs opcionais', 'Historico de reajustes e tendencias']),
    ('Allianz', '61.573.796/0001-66', '0671',
     'Gigante global de seguros com expertise em grandes riscos. Oferece produtos robustos para condominios de alto padrao e complexos multiuso.',
     ARRAY['Grandes Riscos', 'Alto Padrao', 'Condominios Mistos', 'Cobertura Internacional'],
     ARRAY['Vistoria obrigatoria para todos os condominios', 'Franquia variavel conforme historico de sinistros', 'Exige laudo eletrico atualizado (max 5 anos)', 'Cobertura de equipamentos eletronicos como adicional'],
     ARRAY['Requisitos de documentacao para contratacao', 'Coberturas adicionais disponiveis', 'Politica de renovacao e reajuste', 'Exclusoes especificas por tipo de condominio']),
    ('Liberty Seguros', '61.550.141/0001-72', '0665',
     'Seguradora com forte atuacao no mercado brasileiro, integrando seguros patrimoniais e de vida.',
     ARRAY['Seguro Patrimonial', 'Seguro Vida', 'Atendimento Nacional'],
     ARRAY['Analise de risco detalhada para grandes condominios', 'Franquia padrao por tipo de sinistro'],
     ARRAY['Produtos patrimoniais disponiveis', 'Processo de contratacao']),
    ('Mapfre', '61.074.175/0001-38', '0197',
     'Seguradora espanhola com solida presenca no Brasil. Reconhecida por produtos competitivos e processos simplificados de contratacao para condominios.',
     ARRAY['Precos Competitivos', 'Processo Simplificado', 'Condominios Residenciais', 'Assistencia Completa'],
     ARRAY['Contratacao 100% digital para condominios ate 80 unidades', 'Franquia fixa padronizada por regiao', 'Cobertura de danos eletricos inclusa no pacote intermediario', 'Renovacao automatica com aviso previo de 30 dias'],
     ARRAY['Diferenciais competitivos vs concorrentes', 'Mapa de coberturas por plano', 'Regras de cancelamento e estorno', 'Assistencias incluidas e limites']),
    ('HDI Seguros', '29.980.158/0001-57', '5819',
     'Seguradora com forte atuacao no mercado brasileiro, integrando seguros patrimoniais e de vida.',
     ARRAY['Seguro Patrimonial', 'Seguro Vida', 'Atendimento Nacional'],
     ARRAY['Analise de risco detalhada para grandes condominios', 'Franquia padrao por tipo de sinistro'],
     ARRAY['Produtos patrimoniais disponiveis', 'Processo de contratacao']),
    ('Zurich', '17.197.385/0001-21', '0598',
     'Seguradora com forte atuacao no mercado brasileiro, integrando seguros patrimoniais e de vida.',
     ARRAY['Seguro Patrimonial', 'Seguro Vida', 'Atendimento Nacional'],
     ARRAY['Analise de risco detalhada para grandes condominios', 'Franquia padrao por tipo de sinistro'],
     ARRAY['Produtos patrimoniais disponiveis', 'Processo de contratacao']),
    ('Chubb', '33.170.085/0001-05', '0655', NULL, NULL, NULL, NULL)
ON CONFLICT (cnpj) DO NOTHING;

-- ===========================================
-- Apolices Table
-- ===========================================
CREATE TABLE condocompare.apolices (
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

CREATE INDEX idx_apolices_condominio ON condocompare.apolices(condominio_id);
CREATE INDEX idx_apolices_seguradora ON condocompare.apolices(seguradora_id);
CREATE INDEX idx_apolices_status ON condocompare.apolices(status);
CREATE INDEX idx_apolices_data_fim ON condocompare.apolices(data_fim);
CREATE INDEX idx_apolices_active ON condocompare.apolices(active);
CREATE INDEX idx_apolices_condominio_active ON condocompare.apolices(condominio_id, active) WHERE active = true;
CREATE INDEX idx_apolices_active_status ON condocompare.apolices(active, status) WHERE active = true;
CREATE INDEX idx_apolices_active_data_fim ON condocompare.apolices(active, data_fim) WHERE active = true;

-- ===========================================
-- Coberturas Table
-- ===========================================
CREATE TABLE condocompare.coberturas (
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

CREATE INDEX idx_coberturas_apolice ON condocompare.coberturas(apolice_id);
CREATE INDEX idx_coberturas_tipo ON condocompare.coberturas(tipo);

-- ===========================================
-- Vistorias Table
-- (V3 base + V4 audit fix + V8 laudo fields + V10 shared_token)
-- ===========================================
CREATE TABLE condocompare.vistorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID NOT NULL REFERENCES condocompare.condominios(id),
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AGENDADA',
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
    laudo_texto TEXT,
    laudo_gerado_em TIMESTAMP,
    total_itens INTEGER DEFAULT 0,
    itens_conformes INTEGER DEFAULT 0,
    itens_nao_conformes INTEGER DEFAULT 0,
    shared_token VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    active BOOLEAN DEFAULT true
);

CREATE INDEX idx_vistorias_condominio ON condocompare.vistorias(condominio_id);
CREATE INDEX idx_vistorias_status ON condocompare.vistorias(status);
CREATE INDEX idx_vistorias_data ON condocompare.vistorias(data_agendada);
CREATE INDEX idx_vistorias_active ON condocompare.vistorias(active);
CREATE INDEX idx_vistorias_condominio_active ON condocompare.vistorias(condominio_id, active) WHERE active = true;
CREATE INDEX idx_vistorias_active_status ON condocompare.vistorias(active, status) WHERE active = true;
CREATE INDEX idx_vistorias_active_data ON condocompare.vistorias(active, data_agendada DESC) WHERE active = true;
CREATE UNIQUE INDEX idx_vistorias_shared_token ON condocompare.vistorias(shared_token) WHERE shared_token IS NOT NULL;

-- ===========================================
-- Vistoria Itens (Checklist) Table
-- ===========================================
CREATE TABLE condocompare.vistoria_itens (
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

CREATE INDEX idx_vistoria_itens_vistoria ON condocompare.vistoria_itens(vistoria_id);

-- ===========================================
-- Vistoria Fotos Table
-- ===========================================
CREATE TABLE condocompare.vistoria_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vistoria_id UUID NOT NULL REFERENCES condocompare.vistorias(id) ON DELETE CASCADE,
    vistoria_item_id UUID REFERENCES condocompare.vistoria_itens(id) ON DELETE SET NULL,
    url VARCHAR(500) NOT NULL,
    descricao VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vistoria_fotos_vistoria ON condocompare.vistoria_fotos(vistoria_id);

-- ===========================================
-- Sinistros Table
-- (V3 base + V4 audit fix + V15 valor_franquia)
-- ===========================================
CREATE TABLE condocompare.sinistros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID NOT NULL REFERENCES condocompare.condominios(id),
    apolice_id UUID REFERENCES condocompare.documentos(id),
    numero_sinistro VARCHAR(100),
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ABERTO',
    data_ocorrencia TIMESTAMP NOT NULL,
    data_comunicacao TIMESTAMP,
    descricao TEXT NOT NULL,
    local_ocorrencia VARCHAR(255),
    valor_prejuizo DECIMAL(12, 2),
    valor_indenizado DECIMAL(12, 2),
    valor_franquia NUMERIC(12, 2),
    cobertura_acionada VARCHAR(255),
    documentos_ids UUID[],
    fotos_urls TEXT[],
    historico JSONB,
    seguradora_protocolo VARCHAR(100),
    seguradora_contato VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    active BOOLEAN DEFAULT true
);

CREATE INDEX idx_sinistros_condominio ON condocompare.sinistros(condominio_id);
CREATE INDEX idx_sinistros_status ON condocompare.sinistros(status);
CREATE INDEX idx_sinistros_tipo ON condocompare.sinistros(tipo);
CREATE INDEX idx_sinistros_data ON condocompare.sinistros(data_ocorrencia);
CREATE INDEX idx_sinistros_active ON condocompare.sinistros(active);
CREATE INDEX idx_sinistros_condominio_active ON condocompare.sinistros(condominio_id, active) WHERE active = true;
CREATE INDEX idx_sinistros_active_status ON condocompare.sinistros(active, status) WHERE active = true;
CREATE INDEX idx_sinistros_status_active ON condocompare.sinistros(status) WHERE active = true;
CREATE INDEX idx_sinistros_data_ocorrencia_active ON condocompare.sinistros(data_ocorrencia) WHERE active = true;

-- ===========================================
-- Notificacoes Table
-- ===========================================
CREATE TABLE condocompare.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES condocompare.users(id),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP,
    referencia_tipo VARCHAR(50),
    referencia_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

CREATE INDEX idx_notificacoes_user ON condocompare.notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON condocompare.notificacoes(lida);
CREATE INDEX idx_notificacoes_tipo ON condocompare.notificacoes(tipo);
CREATE INDEX idx_notificacoes_user_lida_active ON condocompare.notificacoes(user_id, lida, active) WHERE active = true AND lida = false;

-- ===========================================
-- Parceiros Table
-- ===========================================
CREATE TABLE condocompare.parceiros (
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

CREATE INDEX idx_parceiros_cidade ON condocompare.parceiros(cidade);
CREATE INDEX idx_parceiros_estado ON condocompare.parceiros(estado);
CREATE INDEX idx_parceiros_ativo ON condocompare.parceiros(ativo);
CREATE INDEX idx_parceiros_avaliacao ON condocompare.parceiros(avaliacao);

-- ===========================================
-- Parceiro Categorias Table
-- ===========================================
CREATE TABLE condocompare.parceiro_categorias (
    parceiro_id UUID NOT NULL REFERENCES condocompare.parceiros(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    PRIMARY KEY (parceiro_id, categoria)
);

CREATE INDEX idx_parceiro_categorias_cat ON condocompare.parceiro_categorias(categoria);

-- ===========================================
-- Planos Table (Billing)
-- ===========================================
CREATE TABLE condocompare.planos (
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

-- Insert default planos
INSERT INTO condocompare.planos (nome, codigo, descricao, preco_mensal, preco_anual, max_condominios, max_documentos_mes, max_usuarios, tem_diagnostico, tem_assistente_ia, tem_rag, tem_vistoria_completa, tem_laudo_tecnico, tem_parceiros, tem_relatorios_avancados, tem_api_acesso, ordem, destaque)
VALUES
    ('Gratuito', 'FREE', 'Ideal para conhecer a plataforma. Funcionalidades basicas para um condominio.', 0, 0, 1, 5, 1, false, false, false, false, false, false, false, false, 1, false),
    ('Basico', 'BASIC', 'Para sindicos e pequenas administradoras. Recursos essenciais para gestao de seguro.', 99.90, 999.00, 5, 30, 3, true, true, false, false, false, true, false, false, 2, false),
    ('Profissional', 'PRO', 'Para administradoras e corretoras. Todas as ferramentas para gestao completa.', 249.90, 2499.00, 20, 100, 10, true, true, true, true, true, true, true, false, 3, true),
    ('Enterprise', 'ENTERPRISE', 'Para grandes operacoes. Recursos ilimitados, API e suporte dedicado.', 599.90, 5999.00, 999, 9999, 50, true, true, true, true, true, true, true, true, 4, false)
ON CONFLICT (codigo) DO NOTHING;

-- ===========================================
-- Assinaturas Table (Billing)
-- (V9 base + V17 Stripe fields)
-- ===========================================
CREATE TABLE condocompare.assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES condocompare.users(id),
    plano_id UUID NOT NULL REFERENCES condocompare.planos(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVA',
    data_inicio DATE NOT NULL,
    data_fim DATE,
    data_cancelamento DATE,
    tipo_pagamento VARCHAR(50) DEFAULT 'MENSAL',
    valor DECIMAL(10,2) NOT NULL,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assinaturas_user ON condocompare.assinaturas(user_id);
CREATE INDEX idx_assinaturas_plano ON condocompare.assinaturas(plano_id);
CREATE INDEX idx_assinaturas_status ON condocompare.assinaturas(status);
CREATE INDEX idx_assinaturas_stripe_session ON condocompare.assinaturas(stripe_session_id);

-- ===========================================
-- Chat Conversations Table
-- ===========================================
CREATE TABLE condocompare.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES condocompare.users(id),
    titulo VARCHAR(200),
    context_type VARCHAR(50) DEFAULT 'geral',
    condominio_id UUID REFERENCES condocompare.condominios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_chat_conversations_user ON condocompare.chat_conversations(user_id, active);
CREATE INDEX idx_chat_conversations_updated ON condocompare.chat_conversations(updated_at DESC);

-- ===========================================
-- Chat Messages Table
-- ===========================================
CREATE TABLE condocompare.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES condocompare.chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_conversation ON condocompare.chat_messages(conversation_id, created_at);

-- ===========================================
-- Password Reset Tokens Table
-- ===========================================
CREATE TABLE condocompare.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES condocompare.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token ON condocompare.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON condocompare.password_reset_tokens(user_id);
