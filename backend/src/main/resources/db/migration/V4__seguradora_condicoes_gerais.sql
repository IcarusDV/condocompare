-- V4: campos para Condicoes Gerais e site da seguradora
ALTER TABLE condocompare.seguradoras
    ADD COLUMN IF NOT EXISTS condicoes_gerais_url TEXT,
    ADD COLUMN IF NOT EXISTS condicoes_gerais_nome_arquivo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS condicoes_gerais_atualizado_em TIMESTAMP;
