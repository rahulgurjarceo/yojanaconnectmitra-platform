CREATE TABLE IF NOT EXISTS ycm_ceo_insights (
  insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(32) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info',
  title VARCHAR(240) NOT NULL,
  signal TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  owner_type VARCHAR(32),
  state_code VARCHAR(32),
  district_code VARCHAR(64),
  block_code VARCHAR(64),
  source_url TEXT,
  source_published_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_ceo_insights_category_check CHECK (category IN ('sales','marketing','operations','field','franchise','finance','people','market','government','education','agriculture','risk')),
  CONSTRAINT ycm_ceo_insights_severity_check CHECK (severity IN ('critical','warning','opportunity','info')),
  CONSTRAINT ycm_ceo_insights_status_check CHECK (status IN ('open','acknowledged','in_progress','resolved','dismissed'))
);
CREATE INDEX IF NOT EXISTS ycm_ceo_insights_category_idx ON ycm_ceo_insights(category,status,severity);
CREATE INDEX IF NOT EXISTS ycm_ceo_insights_geo_idx ON ycm_ceo_insights(state_code,district_code,block_code);
CREATE INDEX IF NOT EXISTS ycm_ceo_insights_date_idx ON ycm_ceo_insights(created_at DESC);