-- 025: membership payment ledger and activation state
CREATE TABLE IF NOT EXISTS ycm_membership_payments (
  payment_id UUID PRIMARY KEY,
  membership_id UUID NOT NULL REFERENCES ycm_memberships(membership_id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency='INR'),
  provider TEXT NOT NULL,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_signature TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','success','failed','refunded')),
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ycm_membership_payment_order ON ycm_membership_payments(provider,provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ycm_membership_payment_success ON ycm_membership_payments(membership_id) WHERE status='success';
CREATE INDEX IF NOT EXISTS idx_ycm_membership_payments_membership ON ycm_membership_payments(membership_id,created_at DESC);
