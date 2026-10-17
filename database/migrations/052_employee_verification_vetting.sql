-- YCM ONE: employee / Mitra verification and training status
CREATE TABLE IF NOT EXISTS ycm_employee_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','suspended','rejected')),
  test_score NUMERIC(5,2),
  test_passed_at TIMESTAMPTZ,
  training_completed_at TIMESTAMPTZ,
  verified_by_user_id TEXT,
  verified_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_verifications_status ON ycm_employee_verifications(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_verifications_verifier ON ycm_employee_verifications(verified_by_user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS ycm_employee_verification_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES ycm_employee_verifications(verification_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('test','training','verified','suspended','rejected','note')),
  score NUMERIC(5,2),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_verification_events_lookup ON ycm_employee_verification_events(verification_id,created_at DESC);
