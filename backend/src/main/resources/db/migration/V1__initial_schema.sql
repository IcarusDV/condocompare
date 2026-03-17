-- CondoCompare Initial Schema
-- V1: Users, Condominios, Documents base tables

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

-- ===========================================
-- Documents Table
-- ===========================================
CREATE TABLE condocompare.documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio_id UUID REFERENCES condocompare.condominios(id),
    tipo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    tamanho_bytes BIGINT,
    storage_path VARCHAR(1000) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDENTE',
    dados_extraidos JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_documentos_condominio ON condocompare.documentos(condominio_id);
CREATE INDEX idx_documentos_tipo ON condocompare.documentos(tipo);
CREATE INDEX idx_documentos_status ON condocompare.documentos(status);

-- ===========================================
-- Document Embeddings Table (for RAG)
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON condocompare.audit_log(user_id);
CREATE INDEX idx_audit_entity ON condocompare.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON condocompare.audit_log(created_at);
