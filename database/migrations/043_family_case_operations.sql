-- YCM ONE: case operations, TAT, outcomes and customer feedback.
ALTER TABLE ycm_family_cases
  ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome_code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
  ADD COLUMN IF NOT EXISTS outcome_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS csat_score SMALLINT,
  ADD COLUMN IF NOT EXISTS csat_comment TEXT,
  ADD CONSTRAINT ycm_family_cases_priority_chk CHECK (priority IN ('low','normal','high','urgent')),
  ADD CONSTRAINT ycm_family_cases_csat_chk CHECK (csat_score IS NULL OR (csat_score BETWEEN 1 AND 5));

CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_due ON ycm_family_cases(due_at,status);
CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_assignee ON ycm_family_cases(assigned_to,status);
CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_escalated ON ycm_family_cases(escalated_at,status);
