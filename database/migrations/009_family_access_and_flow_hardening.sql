CREATE TABLE IF NOT EXISTS ycm_family_user_access (
  access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, access_role TEXT NOT NULL DEFAULT 'owner' CHECK (access_role IN ('owner','member','guardian','agent','employee')),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (family_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_family_access_user ON ycm_family_user_access(user_id,status);
CREATE INDEX IF NOT EXISTS idx_ycm_family_access_family ON ycm_family_user_access(family_id,status);
CREATE TABLE IF NOT EXISTS ycm_work_assignment_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id UUID NOT NULL REFERENCES ycm_work_assignments(assignment_id) ON DELETE CASCADE,
  actor_user_id TEXT, from_status TEXT, to_status TEXT, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_assignment_events_assignment ON ycm_work_assignment_events(assignment_id,created_at DESC);
