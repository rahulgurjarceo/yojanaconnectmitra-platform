-- 029: wallet settlement eligibility and payout destinations
ALTER TABLE ycm_wallet_accounts
  ADD COLUMN IF NOT EXISTS withdrawable_paise BIGINT NOT NULL DEFAULT 0 CHECK (withdrawable_paise >= 0);

ALTER TABLE ycm_transaction_splits
  ADD COLUMN IF NOT EXISTS settlement_eligible_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS ycm_payout_destinations (
  destination_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  method VARCHAR(24) NOT NULL CHECK (method IN ('bank','upi','manual')),
  label VARCHAR(120) NOT NULL,
  account_holder_name VARCHAR(180),
  bank_account_last4 VARCHAR(4),
  bank_ifsc VARCHAR(20),
  upi_id VARCHAR(180),
  provider VARCHAR(64),
  provider_beneficiary_id VARCHAR(180),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','pending_verification')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_payout_destinations_user
  ON ycm_payout_destinations(user_id,status);

CREATE TABLE IF NOT EXISTS ycm_settlement_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID REFERENCES ycm_settlements(settlement_id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL,
  reference VARCHAR(180),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN ycm_wallet_accounts.withdrawable_paise IS 'Commission released for payout after the configured settlement window. Ledger balance may appear before payout eligibility.';
COMMENT ON TABLE ycm_payout_destinations IS 'User payout destinations. Sensitive account credentials/secrets are never stored here; use provider beneficiary references where applicable.';

ALTER TABLE ycm_wallet_entries DROP CONSTRAINT IF EXISTS ycm_wallet_entries_entry_type_check;
ALTER TABLE ycm_wallet_entries ADD CONSTRAINT ycm_wallet_entries_entry_type_check
  CHECK (entry_type IN ('commission_credit','commission_reversal','settlement_release','settlement_debit','adjustment_credit','adjustment_debit'));

CREATE INDEX IF NOT EXISTS idx_ycm_transaction_splits_settlement_eligible
  ON ycm_transaction_splits(recipient_user_id,settlement_eligible_at,status);
