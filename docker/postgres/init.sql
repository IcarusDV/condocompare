-- CondoCompare Database Initialization
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema for better organization
CREATE SCHEMA IF NOT EXISTS condocompare;

-- Grant permissions
GRANT ALL ON SCHEMA condocompare TO condocompare;
