-- YCM CRM knowledge library and workforce foundation
CREATE TABLE IF NOT EXISTS ycm_crm_library_items (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  category VARCHAR(40) NOT NULL CHECK (category IN ('company','product','service','scheme','sales','training','marketing','legal','hr','faq','operations')),
  content_type VARCHAR(20) NOT NULL DEFAULT 'link' CHECK (content_type IN ('article','pdf','video','image','audio','link','file')),
  body TEXT,
  asset_url TEXT,
  language_code VARCHAR(12) NOT NULL DEFAULT 'hi',
  visibility_roles TEXT[] NOT NULL DEFAULT ARRAY['ceo','admin','management','employee','team_lead','branch_manager'],
  geography_state VARCHAR(20),
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by VARCHAR(120) NOT NULL,
  updated_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (body IS NULL OR length(body) <= 50000),
  CHECK (asset_url IS NULL OR (asset_url LIKE 'https://%' AND length(asset_url) <= 2048))
);
CREATE INDEX IF NOT EXISTS ycm_crm_library_search_idx ON ycm_crm_library_items USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(body,'')));
CREATE INDEX IF NOT EXISTS ycm_crm_library_visibility_idx ON ycm_crm_library_items(status, category);
CREATE TABLE IF NOT EXISTS ycm_crm_team_members (
  id BIGSERIAL PRIMARY KEY,
  manager_user_id VARCHAR(120) NOT NULL REFERENCES ycm_users(user_id) ON DELETE CASCADE,
  member_user_id VARCHAR(120) NOT NULL REFERENCES ycm_users(user_id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK (member_type IN ('agent','team_lead','sales_manager','block_manager','district_manager','state_manager')),
  state_code VARCHAR(20),
  district_code VARCHAR(40),
  block_code VARCHAR(40),
  village_code VARCHAR(60),
  monthly_target_paise BIGINT NOT NULL DEFAULT 0 CHECK (monthly_target_paise >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(manager_user_id, member_user_id),
  CHECK(manager_user_id <> member_user_id)
);
CREATE INDEX IF NOT EXISTS ycm_crm_team_manager_idx ON ycm_crm_team_members(manager_user_id, active);
CREATE INDEX IF NOT EXISTS ycm_crm_team_member_idx ON ycm_crm_team_members(member_user_id, active);
CREATE TABLE IF NOT EXISTS ycm_crm_agent_daily_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(120) NOT NULL REFERENCES ycm_users(user_id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_created INTEGER NOT NULL DEFAULT 0 CHECK (leads_created >= 0),
  calls_made INTEGER NOT NULL DEFAULT 0 CHECK (calls_made >= 0),
  sales_count INTEGER NOT NULL DEFAULT 0 CHECK (sales_count >= 0),
  sales_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (sales_amount_paise >= 0),
  followups_due INTEGER NOT NULL DEFAULT 0 CHECK (followups_due >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, metric_date)
);
