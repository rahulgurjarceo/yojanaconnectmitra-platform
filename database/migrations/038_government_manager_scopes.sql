-- 038: geography-scoped government operations roles
ALTER TABLE ycm_users DROP CONSTRAINT IF EXISTS ycm_users_role_check;
ALTER TABLE ycm_users ADD CONSTRAINT ycm_users_role_check CHECK (role IN ('family','farmer','lawyer','student','employee','team_lead','branch_manager','management','ceo','admin','partner','referral'));

CREATE TABLE IF NOT EXISTS ycm_government_manager_scopes (
  scope_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  geography_level TEXT NOT NULL CHECK (geography_level IN ('india','state','district','block','gram_panchayat','village','ward')),
  state_code TEXT,
  district_code TEXT,
  block_code TEXT,
  gram_panchayat_code TEXT,
  village_code TEXT,
  ward_code TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, geography_level, state_code, district_code, block_code, gram_panchayat_code, village_code, ward_code)
);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_manager_scopes_user ON ycm_government_manager_scopes(user_id,active);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_manager_scopes_geo ON ycm_government_manager_scopes(geography_level,state_code,district_code,block_code,gram_panchayat_code,village_code,ward_code);
