-- YCM ONE: Human Mitra assignment, escalation policy and immutable case timeline.
CREATE TABLE IF NOT EXISTS ycm_case_timeline (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES ycm_family_cases(case_id) ON DELETE CASCADE,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  from_status VARCHAR(32),
  to_status VARCHAR(32),
  actor_type VARCHAR(32) NOT NULL,
  actor_id TEXT,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_case_timeline_case ON ycm_case_timeline(case_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_case_timeline_family ON ycm_case_timeline(family_id,created_at DESC);

CREATE TABLE IF NOT EXISTS ycm_case_escalation_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'normal',
  trigger_type VARCHAR(32) NOT NULL CHECK (trigger_type IN ('tat_breach','cri_below','no_update','rejection','manual')),
  threshold_value NUMERIC,
  escalate_to_team UUID REFERENCES ycm_teams(team_id) ON DELETE SET NULL,
  escalate_after_minutes INTEGER NOT NULL DEFAULT 0 CHECK (escalate_after_minutes >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_case_escalation_active ON ycm_case_escalation_rules(active,trigger_type);

ALTER TABLE ycm_work_assignments
  ADD COLUMN IF NOT EXISTS escalation_level SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
