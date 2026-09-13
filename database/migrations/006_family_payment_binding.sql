-- YCM ONE payment binding hardening
-- Safe for databases where 001_customer_family.sql has already been applied.
ALTER TABLE ycm_family_payments
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ycm_family_payments_provider_payment
  ON ycm_family_payments(provider_payment_id);
