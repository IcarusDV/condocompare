-- Add Stripe fields to assinaturas
ALTER TABLE condocompare.assinaturas ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE condocompare.assinaturas ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_assinaturas_stripe_session ON condocompare.assinaturas(stripe_session_id);
