-- V15: Sinistros improvements - valor_franquia column
ALTER TABLE condocompare.sinistros
    ADD COLUMN IF NOT EXISTS valor_franquia NUMERIC(12, 2);

-- Index for stats queries
CREATE INDEX IF NOT EXISTS idx_sinistros_status_active
    ON condocompare.sinistros(status) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_sinistros_data_ocorrencia_active
    ON condocompare.sinistros(data_ocorrencia) WHERE active = true;
