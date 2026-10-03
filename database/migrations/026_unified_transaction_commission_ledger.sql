-- 026: unified transaction ledger, commission allocation, wallets and settlement
CREATE TABLE IF NOT EXISTS ycm_commission_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(120) REFERENCES ycm_service_master(service_code),
  transaction_type VARCHAR(64) NOT NULL DEFAULT 'service',
  ycm_percent NUMERIC(7,3) NOT NULL DEFAULT 60 CHECK (ycm_percent>=0 AND ycm_percent<=100),
  agent_percent NUMERIC(7,3) NOT NULL DEFAULT 40 CHECK (agent_percent>=0 AND agent_percent<=100),
  referral_percent NUMERIC(7,3) NOT NULL DEFAULT 0 CHECK (referral_percent>=0 AND referral_percent<=100),
  referral_funded_by VARCHAR(16) NOT NULL DEFAULT 'agent' CHECK (referral_funded_by IN ('agent','ycm')),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ycm_commission_rule_total CHECK (ycm_percent + agent_percent = 100 AND referral_percent >= 0 AND referral_percent <= agent_percent)
);
CREATE INDEX IF NOT EXISTS idx_ycm_commission_rules_lookup ON ycm_commission_rules(service_code,transaction_type,status,effective_from DESC);

CREATE TABLE IF NOT EXISTS ycm_financial_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference VARCHAR(180) UNIQUE,
  transaction_type VARCHAR(64) NOT NULL,
  service_code VARCHAR(120) REFERENCES ycm_service_master(service_code),
  family_id UUID,
  customer_user_id UUID REFERENCES ycm_users(id),
  agent_user_id UUID REFERENCES ycm_users(id),
  referral_user_id UUID REFERENCES ycm_users(id),
  provider_code VARCHAR(120),
  provider_transaction_id VARCHAR(180),
  gross_amount_paise BIGINT NOT NULL CHECK (gross_amount_paise >= 0),
  provider_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (provider_fee_paise >= 0),
  net_amount_paise BIGINT NOT NULL CHECK (net_amount_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  state VARCHAR(24) NOT NULL DEFAULT 'initiated' CHECK (state IN ('initiated','provider_processing','success','failed','reversed','reconciled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_financial_net_check CHECK (net_amount_paise <= gross_amount_paise)
);
CREATE INDEX IF NOT EXISTS idx_ycm_financial_tx_agent ON ycm_financial_transactions(agent_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_financial_tx_service ON ycm_financial_transactions(service_code,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_financial_tx_provider ON ycm_financial_transactions(provider_code,provider_transaction_id);

CREATE TABLE IF NOT EXISTS ycm_transaction_splits (
  split_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES ycm_financial_transactions(transaction_id) ON DELETE CASCADE,
  recipient_type VARCHAR(16) NOT NULL CHECK (recipient_type IN ('ycm','agent','referral')),
  recipient_user_id UUID REFERENCES ycm_users(id),
  percent NUMERIC(7,3) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  funding_source VARCHAR(16) NOT NULL DEFAULT 'gross' CHECK (funding_source IN ('gross','agent','ycm')),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','credited','reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ycm_transaction_split_recipient ON ycm_transaction_splits(transaction_id,recipient_type,recipient_user_id);

CREATE TABLE IF NOT EXISTS ycm_wallet_accounts (
  wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES ycm_users(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  available_paise BIGINT NOT NULL DEFAULT 0 CHECK (available_paise >= 0),
  pending_paise BIGINT NOT NULL DEFAULT 0 CHECK (pending_paise >= 0),
  lifetime_credited_paise BIGINT NOT NULL DEFAULT 0 CHECK (lifetime_credited_paise >= 0),
  lifetime_debited_paise BIGINT NOT NULL DEFAULT 0 CHECK (lifetime_debited_paise >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_wallet_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES ycm_wallet_accounts(wallet_id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES ycm_financial_transactions(transaction_id),
  split_id UUID REFERENCES ycm_transaction_splits(split_id),
  entry_type VARCHAR(24) NOT NULL CHECK (entry_type IN ('commission_credit','commission_reversal','settlement_debit','adjustment_credit','adjustment_debit')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  balance_after_paise BIGINT NOT NULL CHECK (balance_after_paise >= 0),
  idempotency_key VARCHAR(180) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_wallet_entries_wallet ON ycm_wallet_entries(wallet_id,created_at DESC);

CREATE TABLE IF NOT EXISTS ycm_settlements (
  settlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id),
  wallet_id UUID NOT NULL REFERENCES ycm_wallet_accounts(wallet_id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  method VARCHAR(24) NOT NULL CHECK (method IN ('bank','upi','manual')),
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processing','paid','failed','reversed')),
  reference VARCHAR(180),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION ycm_touch_financial_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ycm_financial_transactions_updated_at ON ycm_financial_transactions;
CREATE TRIGGER ycm_financial_transactions_updated_at BEFORE UPDATE ON ycm_financial_transactions FOR EACH ROW EXECUTE FUNCTION ycm_touch_financial_updated_at();

COMMENT ON TABLE ycm_financial_transactions IS 'Single financial transaction ledger for membership, AEPS, assisted services, bookings and other monetized YCM flows.';
COMMENT ON TABLE ycm_transaction_splits IS 'Immutable allocation record. Default business rule can be 60% YCM / 40% agent; referral can be carved from the configured funding source.';
COMMENT ON TABLE ycm_wallet_accounts IS 'Partner/agent/referral commission wallets. Wallet balance changes only through ledger entries.';
