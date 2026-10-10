-- YCM ONE: link family cases to service applications without changing existing case data.
ALTER TABLE ycm_family_cases
  ADD COLUMN IF NOT EXISTS application_id UUID;

CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_application
  ON ycm_family_cases(application_id);
