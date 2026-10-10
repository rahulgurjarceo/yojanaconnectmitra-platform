-- YCM ONE: Case Resolution/Readiness Index (CRI) operational evidence.
CREATE TABLE IF NOT EXISTS ycm_case_cri (
  case_id UUID PRIMARY KEY REFERENCES ycm_family_cases(case_id) ON DELETE CASCADE,
  tat_score SMALLINT NOT NULL DEFAULT 100 CHECK (tat_score BETWEEN 0 AND 100),
  documents_score SMALLINT NOT NULL DEFAULT 100 CHECK (documents_score BETWEEN 0 AND 100),
  payment_score SMALLINT NOT NULL DEFAULT 100 CHECK (payment_score BETWEEN 0 AND 100),
  employee_score SMALLINT NOT NULL DEFAULT 100 CHECK (employee_score BETWEEN 0 AND 100),
  authority_score SMALLINT NOT NULL DEFAULT 100 CHECK (authority_score BETWEEN 0 AND 100),
  office_visits_score SMALLINT NOT NULL DEFAULT 100 CHECK (office_visits_score BETWEEN 0 AND 100),
  government_visits_score SMALLINT NOT NULL DEFAULT 100 CHECK (government_visits_score BETWEEN 0 AND 100),
  followups_score SMALLINT NOT NULL DEFAULT 100 CHECK (followups_score BETWEEN 0 AND 100),
  rework_score SMALLINT NOT NULL DEFAULT 100 CHECK (rework_score BETWEEN 0 AND 100),
  progress_score SMALLINT NOT NULL DEFAULT 100 CHECK (progress_score BETWEEN 0 AND 100),
  outcome_score SMALLINT NOT NULL DEFAULT 100 CHECK (outcome_score BETWEEN 0 AND 100),
  satisfaction_score SMALLINT NOT NULL DEFAULT 100 CHECK (satisfaction_score BETWEEN 0 AND 100),
  cri_score SMALLINT NOT NULL DEFAULT 100 CHECK (cri_score BETWEEN 0 AND 100),
  risk_band VARCHAR(32) NOT NULL DEFAULT 'excellent' CHECK (risk_band IN ('excellent','attention_required','at_risk')),
  blocking_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_case_cri_band ON ycm_case_cri(risk_band, cri_score);
CREATE INDEX IF NOT EXISTS idx_ycm_case_cri_updated ON ycm_case_cri(updated_at DESC);
