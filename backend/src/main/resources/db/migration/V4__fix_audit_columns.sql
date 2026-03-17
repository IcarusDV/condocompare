-- Migration V4: Fix audit columns types

-- Remove foreign key constraints and change column types from UUID to VARCHAR

-- Vistorias
ALTER TABLE condocompare.vistorias DROP CONSTRAINT IF EXISTS vistorias_created_by_fkey;
ALTER TABLE condocompare.vistorias DROP CONSTRAINT IF EXISTS vistorias_updated_by_fkey;
ALTER TABLE condocompare.vistorias ALTER COLUMN created_by TYPE VARCHAR(255);
ALTER TABLE condocompare.vistorias ALTER COLUMN updated_by TYPE VARCHAR(255);

-- Sinistros
ALTER TABLE condocompare.sinistros DROP CONSTRAINT IF EXISTS sinistros_created_by_fkey;
ALTER TABLE condocompare.sinistros DROP CONSTRAINT IF EXISTS sinistros_updated_by_fkey;
ALTER TABLE condocompare.sinistros ALTER COLUMN created_by TYPE VARCHAR(255);
ALTER TABLE condocompare.sinistros ALTER COLUMN updated_by TYPE VARCHAR(255);
