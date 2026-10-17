-- 050: service application compliance intelligence snapshot
ALTER TABLE ycm_service_applications
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS compliance_analysis JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ycm_service_applications_deadline
  ON ycm_service_applications(service_code,application_deadline)
  WHERE application_deadline IS NOT NULL;

COMMENT ON COLUMN ycm_service_applications.compliance_analysis IS 'Machine-readable readiness score, risk, document findings and recommended actions captured when an application is prepared.';
