-- 016: controlled work submission and approval
ALTER TABLE ycm_work_assignments
  ADD COLUMN IF NOT EXISTS employee_result TEXT,
  ADD COLUMN IF NOT EXISTS employee_note TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','rework')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE INDEX IF NOT EXISTS idx_ycm_assignments_approval
  ON ycm_work_assignments(assigned_to, approval_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ycm_assignments_review_queue
  ON ycm_work_assignments(team_id, approval_status, updated_at DESC);

-- 017-style target authority is intentionally separate from employee self-reporting.
CREATE TABLE IF NOT EXISTS ycm_org_targets (
  target_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('company','team','employee')),
  owner_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES ycm_teams(team_id) ON DELETE SET NULL,
  parent_target_id UUID REFERENCES ycm_org_targets(target_id) ON DELETE SET NULL,
  metric_code VARCHAR(80) NOT NULL,
  target_value NUMERIC(20,2) NOT NULL CHECK (target_value >= 0),
  unit VARCHAR(32) NOT NULL DEFAULT 'count',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  assigned_by UUID NOT NULL REFERENCES ycm_users(id) ON DELETE RESTRICT,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start),
  CHECK (
    (target_type='company' AND owner_user_id IS NULL AND team_id IS NULL)
    OR (target_type='team' AND team_id IS NOT NULL AND owner_user_id IS NULL)
    OR (target_type='employee' AND owner_user_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_ycm_org_targets_owner ON ycm_org_targets(owner_user_id, status, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ycm_org_targets_team ON ycm_org_targets(team_id, status, period_start, period_end);
