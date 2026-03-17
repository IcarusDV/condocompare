-- Add details column to existing audit_log table (table created in V1)
ALTER TABLE condocompare.audit_log ADD COLUMN IF NOT EXISTS details TEXT;
