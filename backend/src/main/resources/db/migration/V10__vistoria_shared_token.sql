-- Add shared_token column for external link sharing
ALTER TABLE condocompare.vistorias ADD COLUMN IF NOT EXISTS shared_token VARCHAR(36);

-- Unique partial index for fast lookup (only non-null tokens)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vistorias_shared_token
    ON condocompare.vistorias(shared_token)
    WHERE shared_token IS NOT NULL;
