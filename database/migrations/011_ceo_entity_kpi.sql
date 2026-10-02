CREATE TABLE IF NOT EXISTS ycm_ceo_entities (
  entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(32) NOT NULL,
  user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  display_name VARCHAR(200) NOT NULL,
  mobile VARCHAR(20),
  email VARCHAR(320),
  state_code VARCHAR(32),
  district_code VARCHAR(64),
  block_code VARCHAR(64),
  village_code VARCHAR(64),
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_ceo_entities_type_check CHECK (entity_type IN ('employee','franchise','referral','partner','retailer','government','district','block','village','agent','other')),
  CONSTRAINT ycm_ceo_entities_status_check CHECK (status IN ('active','pending','suspended','disabled'))
);
CREATE INDEX IF NOT EXISTS ycm_ceo_entities_type_idx ON ycm_ceo_entities(entity_type);
CREATE INDEX IF NOT EXISTS ycm_ceo_entities_geo_idx ON ycm_ceo_entities(state_code,district_code,block_code,village_code);
CREATE INDEX IF NOT EXISTS ycm_ceo_entities_user_idx ON ycm_ceo_entities(user_id);

CREATE TABLE IF NOT EXISTS ycm_ceo_entity_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES ycm_ceo_entities(entity_id) ON DELETE CASCADE,
  transaction_type VARCHAR(32) NOT NULL,
  direction VARCHAR(16) NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  reference_type VARCHAR(64),
  reference_id VARCHAR(128),
  status VARCHAR(24) NOT NULL DEFAULT 'completed',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ycm_ceo_entity_tx_direction_check CHECK (direction IN ('in','out')),
  CONSTRAINT ycm_ceo_entity_tx_status_check CHECK (status IN ('pending','completed','failed','reversed'))
);
CREATE INDEX IF NOT EXISTS ycm_ceo_entity_tx_entity_date_idx ON ycm_ceo_entity_transactions(entity_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS ycm_ceo_entity_tx_status_idx ON ycm_ceo_entity_transactions(status);

CREATE TABLE IF NOT EXISTS ycm_ceo_entity_work (
  work_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES ycm_ceo_entities(entity_id) ON DELETE CASCADE,
  work_type VARCHAR(64) NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'assigned',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ycm_ceo_entity_work_status_check CHECK (status IN ('assigned','in_progress','completed','blocked','cancelled'))
);
CREATE INDEX IF NOT EXISTS ycm_ceo_entity_work_entity_idx ON ycm_ceo_entity_work(entity_id,status);

CREATE TABLE IF NOT EXISTS ycm_ceo_entity_audit (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES ycm_ceo_entities(entity_id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_ceo_entity_audit_entity_idx ON ycm_ceo_entity_audit(entity_id,created_at DESC);
