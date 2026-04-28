# V4 — Seguradora Condições Gerais

## Caso o Flyway falhe no boot do Render (mesmo problema da V3 com checksum)

**Sintoma:** boot falha com `FlywayValidateException: Migration checksum mismatch for migration version 4`.

### Passo a passo

1. Abra o **Supabase SQL Editor**.

2. Aplique o DDL da migration:

```sql
ALTER TABLE condocompare.seguradoras
    ADD COLUMN IF NOT EXISTS condicoes_gerais_url TEXT,
    ADD COLUMN IF NOT EXISTS condicoes_gerais_nome_arquivo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS condicoes_gerais_atualizado_em TIMESTAMP;
```

3. Registre manualmente no histórico do Flyway (se a tabela já existir) e ajuste o checksum:

```sql
-- Insere o registro
INSERT INTO condocompare.flyway_schema_history (
    installed_rank, version, description, type, script,
    checksum, installed_by, installed_on, execution_time, success
) VALUES (
    (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM condocompare.flyway_schema_history),
    '4',
    'seguradora condicoes gerais',
    'SQL',
    'V4__seguradora_condicoes_gerais.sql',
    NULL,  -- placeholder; ajusta no passo seguinte
    'manual',
    NOW(),
    0,
    true
)
ON CONFLICT (installed_rank) DO NOTHING;
```

4. Pegue o checksum real que o Flyway computou (ele aparece no log do Render: `Resolved locally: 1234567890`) e atualize:

```sql
UPDATE condocompare.flyway_schema_history
SET checksum = <CHECKSUM_DO_LOG>
WHERE version = '4';
```

5. Confirme:

```sql
SELECT installed_rank, version, description, checksum, success
FROM condocompare.flyway_schema_history
WHERE version = '4';
```

6. **Manual Deploy → Restart Service** no Render. O boot deve completar.
