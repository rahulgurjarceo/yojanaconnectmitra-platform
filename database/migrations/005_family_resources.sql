-- YCM ONE Family 360 resource indexes/constraints.
-- Resource tables already exist in 001_customer_family.sql.
-- This migration adds explicit CRI/CSAT persistence without storing raw identity documents.

CREATE TABLE IF NOT EXISTS ycm_family_cri (
  cri_id UUID PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  case_id UUID REFERENCES ycm_family_cases(case_id) ON DELETE SET NULL,
  assignment_status TEXT NOT NULL DEFAULT 'unassigned',
  tat_due_at TIMESTAMPTZ,
  outcome TEXT,
  score NUMERIC(5,2),
  csat_score SMALLINT CHECK (csat_score IS NULL OR (csat_score BETWEEN 1 AND 5)),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_family_cri_family ON ycm_family_cri(family_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_family_cri_case ON ycm_family_cri(case_id);
