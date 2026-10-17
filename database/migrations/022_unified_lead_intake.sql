-- 022: Unified lead intake and service-to-case bridge
ALTER TABLE ycm_family_cases
  ADD COLUMN IF NOT EXISTS service_code VARCHAR(120) REFERENCES ycm_service_master(service_code) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_service ON ycm_family_cases(service_code,status);

CREATE TABLE IF NOT EXISTS ycm_leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE SET NULL,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'manual',
  name VARCHAR(240) NOT NULL,
  mobile VARCHAR(32),
  email VARCHAR(240),
  state_code VARCHAR(16),
  district_code VARCHAR(64),
  block_code VARCHAR(64),
  village_code VARCHAR(128),
  need_text TEXT,
  service_code VARCHAR(120) REFERENCES ycm_service_master(service_code) ON DELETE SET NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','assigned','in_progress','converted','lost','closed')),
  assigned_to UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  assigned_team_id UUID REFERENCES ycm_teams(team_id) ON DELETE SET NULL,
  next_follow_up_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ycm_leads_status ON ycm_leads(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_leads_assignee ON ycm_leads(assigned_to,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_leads_service ON ycm_leads(service_code,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_leads_mobile ON ycm_leads(mobile);

CREATE TABLE IF NOT EXISTS ycm_lead_service_matches (
  lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  match_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(lead_id,service_code)
);

CREATE TABLE IF NOT EXISTS ycm_lead_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ycm_lead_events_lead ON ycm_lead_events(lead_id,created_at DESC);

COMMENT ON TABLE ycm_leads IS 'Canonical lead intake. All channels feed one lead record and can convert into the common family/case lifecycle.';
COMMENT ON TABLE ycm_lead_service_matches IS 'Service matching suggestions; selected service becomes the canonical service_code on the lead/case.';
