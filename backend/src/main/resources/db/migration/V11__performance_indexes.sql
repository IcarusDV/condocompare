-- Migration V11: Performance indexes
-- Adds compound indexes for frequently filtered columns (active + status/type)

-- Condominios: all queries filter by active=true
CREATE INDEX IF NOT EXISTS idx_condominios_active ON condocompare.condominios(active);
CREATE INDEX IF NOT EXISTS idx_condominios_active_estado ON condocompare.condominios(active, estado) WHERE active = true;

-- Documentos: all queries filter by active=true, often combined with tipo or condominio_id
CREATE INDEX IF NOT EXISTS idx_documentos_active ON condocompare.documentos(active);
CREATE INDEX IF NOT EXISTS idx_documentos_condominio_active ON condocompare.documentos(condominio_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_documentos_tipo_active ON condocompare.documentos(tipo, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_documentos_condominio_tipo_active ON condocompare.documentos(condominio_id, tipo, active) WHERE active = true;

-- Vistorias: all queries filter by active=true, often combined with status or condominio_id
CREATE INDEX IF NOT EXISTS idx_vistorias_active ON condocompare.vistorias(active);
CREATE INDEX IF NOT EXISTS idx_vistorias_condominio_active ON condocompare.vistorias(condominio_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_vistorias_active_status ON condocompare.vistorias(active, status) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_vistorias_active_data ON condocompare.vistorias(active, data_agendada DESC) WHERE active = true;

-- Sinistros: all queries filter by active=true, often combined with status or condominio_id
CREATE INDEX IF NOT EXISTS idx_sinistros_active ON condocompare.sinistros(active);
CREATE INDEX IF NOT EXISTS idx_sinistros_condominio_active ON condocompare.sinistros(condominio_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sinistros_active_status ON condocompare.sinistros(active, status) WHERE active = true;

-- Apolices: compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_apolices_active ON condocompare.apolices(active);
CREATE INDEX IF NOT EXISTS idx_apolices_condominio_active ON condocompare.apolices(condominio_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_apolices_active_status ON condocompare.apolices(active, status) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_apolices_active_data_fim ON condocompare.apolices(active, data_fim) WHERE active = true;

-- Notificacoes: compound index for unread count (most frequent query)
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida_active ON condocompare.notificacoes(user_id, lida, active) WHERE active = true AND lida = false;

-- Users: index on active column
CREATE INDEX IF NOT EXISTS idx_users_active ON condocompare.users(active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON condocompare.users(email, active) WHERE active = true;
