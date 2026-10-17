-- 031: Eko retailer binding and AePS transaction state
CREATE TABLE IF NOT EXISTS ycm_eko_retailer_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES ycm_users(id) ON DELETE CASCADE,
  eko_user_code VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  service_code VARCHAR(16) NOT NULL DEFAULT '43',
  activated_at TIMESTAMPTZ,
  daily_auth_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_eko_retailer_status ON ycm_eko_retailer_accounts(status,updated_at DESC);
CREATE TABLE IF NOT EXISTS ycm_eko_aeps_transactions (
  eko_transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id),
  eko_user_code VARCHAR(64) NOT NULL,
  client_ref_id VARCHAR(20) NOT NULL UNIQUE,
  transaction_type VARCHAR(48) NOT NULL CHECK (transaction_type IN ('cash_withdrawal','balance_enquiry','mini_statement','aadhaar_to_aadhaar_transfer')),
  amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  customer_mobile VARCHAR(32),
  bank_code VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','provider_processing','success','failed','reversed','inquiry_required')),
  eko_tid VARCHAR(180),
  bank_reference VARCHAR(180),
  provider_message TEXT,
  last_inquired_at TIMESTAMPTZ,
  final_at TIMESTAMPTZ,
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_eko_aeps_user ON ycm_eko_aeps_transactions(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_eko_aeps_status ON ycm_eko_aeps_transactions(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_eko_aeps_tid ON ycm_eko_aeps_transactions(eko_tid);
CREATE OR REPLACE FUNCTION ycm_touch_eko_aeps_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ycm_eko_retailer_updated_at ON ycm_eko_retailer_accounts;
CREATE TRIGGER ycm_eko_retailer_updated_at BEFORE UPDATE ON ycm_eko_retailer_accounts FOR EACH ROW EXECUTE FUNCTION ycm_touch_eko_aeps_updated_at();
DROP TRIGGER IF EXISTS ycm_eko_aeps_updated_at ON ycm_eko_aeps_transactions;
CREATE TRIGGER ycm_eko_aeps_updated_at BEFORE UPDATE ON ycm_eko_aeps_transactions FOR EACH ROW EXECUTE FUNCTION ycm_touch_eko_aeps_updated_at();
COMMENT ON TABLE ycm_eko_retailer_accounts IS 'YCM agent to Eko retailer user-code binding. Eko credentials remain in environment/secret manager.';
COMMENT ON TABLE ycm_eko_aeps_transactions IS 'Provider transaction state used to safely reconcile Eko callbacks/inquiries into the YCM financial ledger.';