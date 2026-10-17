-- 059: YCM ONE universal journey context across all 35 domains.
-- Reuses Family 360 cases, service applications, provider registry and geography.
ALTER TABLE ycm_family_cases
  ADD COLUMN IF NOT EXISTS need_text TEXT,
  ADD COLUMN IF NOT EXISTS location_id UUID,
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS referral_status VARCHAR(32) NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS next_action TEXT;

CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_journey_domain
  ON ycm_family_cases(case_category_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_journey_location
  ON ycm_family_cases(location_id,status);

ALTER TABLE ycm_service_providers
  ADD COLUMN IF NOT EXISTS location_id UUID,
  ADD COLUMN IF NOT EXISTS state_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS district_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS block_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ycm_service_providers_geo
  ON ycm_service_providers(location_id,state_code,district_code,block_code,status);

COMMENT ON COLUMN ycm_family_cases.need_text IS 'Customer need captured by Family 360/AI Mitra/voice.';
COMMENT ON COLUMN ycm_family_cases.location_id IS 'Operating/service location selected for the journey.';
COMMENT ON COLUMN ycm_family_cases.provider_id IS 'Relevant provider selected or referred during the journey.';
COMMENT ON COLUMN ycm_family_cases.referral_status IS 'Provider/authority referral lifecycle for the case.';
