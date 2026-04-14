-- ============================================================================
-- V3: Adicionar campos de Estrutura/Seguro estendido ao Condominio
-- ============================================================================
-- Adiciona 15 campos novos:
--   - 11 campos de Estrutura (área comercial, garagem, pavimentos, etc.)
--   - 2 campos de Seguro (bônus, sinistros)
--   - 2 campos condicionais (casas/salas para tipos horizontais)
-- ============================================================================

ALTER TABLE condocompare.condominios
    -- Estrutura: Área Comercial
    ADD COLUMN IF NOT EXISTS possui_area_comercial BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tamanho_area_comercial NUMERIC(12, 2),

    -- Estrutura: Funcionários Registrados
    ADD COLUMN IF NOT EXISTS num_funcionarios_registrados INTEGER,
    ADD COLUMN IF NOT EXISTS idade_funcionarios_registrados VARCHAR(100),

    -- Estrutura: Pavimentos
    ADD COLUMN IF NOT EXISTS num_pavimentos INTEGER,

    -- Estrutura: Garagem
    ADD COLUMN IF NOT EXISTS possui_garagem BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS vagas_garagem INTEGER,

    -- Estrutura: Espaços de Conveniência (array)
    ADD COLUMN IF NOT EXISTS espacos_conveniencia TEXT[],
    ADD COLUMN IF NOT EXISTS espacos_conveniencia_outros VARCHAR(255),

    -- Estrutura: Sistema de Proteção contra Incêndio (array)
    ADD COLUMN IF NOT EXISTS sistema_protecao_incendio TEXT[],
    ADD COLUMN IF NOT EXISTS sistema_protecao_incendio_outros VARCHAR(255),

    -- Estrutura: Outros
    ADD COLUMN IF NOT EXISTS possui_recarga_eletricos BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS possui_bicicletario BOOLEAN DEFAULT FALSE,

    -- Seguro: Bônus e Histórico de Sinistros
    ADD COLUMN IF NOT EXISTS bonus_anos_sem_sinistro VARCHAR(50),
    ADD COLUMN IF NOT EXISTS quantidade_sinistros VARCHAR(50),

    -- Tipo Horizontal: Casas / Salas
    ADD COLUMN IF NOT EXISTS numero_casas INTEGER,
    ADD COLUMN IF NOT EXISTS numero_salas INTEGER;

-- Comentários para documentação
COMMENT ON COLUMN condocompare.condominios.possui_area_comercial IS 'Se o condomínio possui área comercial';
COMMENT ON COLUMN condocompare.condominios.tamanho_area_comercial IS 'Tamanho da área comercial em m²';
COMMENT ON COLUMN condocompare.condominios.num_pavimentos IS 'Número total de pavimentos';
COMMENT ON COLUMN condocompare.condominios.possui_garagem IS 'Se o condomínio possui garagem';
COMMENT ON COLUMN condocompare.condominios.vagas_garagem IS 'Número de vagas de garagem';
COMMENT ON COLUMN condocompare.condominios.espacos_conveniencia IS 'Lista de espaços (Minimercado, Farmácia, etc.)';
COMMENT ON COLUMN condocompare.condominios.sistema_protecao_incendio IS 'Lista de sistemas (Extintores, Hidrantes, Sprinklers, etc.)';
COMMENT ON COLUMN condocompare.condominios.possui_recarga_eletricos IS 'Tomadas para veículos elétricos';
COMMENT ON COLUMN condocompare.condominios.possui_bicicletario IS 'Bicicletário disponível';
COMMENT ON COLUMN condocompare.condominios.bonus_anos_sem_sinistro IS 'Anos sem sinistro (bônus do seguro)';
COMMENT ON COLUMN condocompare.condominios.quantidade_sinistros IS 'Histórico de quantidade de sinistros';
COMMENT ON COLUMN condocompare.condominios.numero_casas IS 'Número de casas (residencial horizontal)';
COMMENT ON COLUMN condocompare.condominios.numero_salas IS 'Número de salas (comercial horizontal)';
