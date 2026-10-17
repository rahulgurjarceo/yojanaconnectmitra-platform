-- 034: geographic service entry-gate mapping
-- Connects the unified service master to YCM's state/district/block/gram-panchayat/village operating geography.
CREATE TABLE IF NOT EXISTS ycm_service_geography_scope (
  scope_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  geography_level VARCHAR(24) NOT NULL CHECK (geography_level IN ('state','district','block','gram_panchayat','village')),
  state_code VARCHAR(32),
  district_code VARCHAR(32),
  block_code VARCHAR(32),
  gram_panchayat_code VARCHAR(64),
  village_code VARCHAR(64),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (geography_level='state' AND state_code IS NOT NULL AND district_code IS NULL AND block_code IS NULL AND gram_panchayat_code IS NULL AND village_code IS NULL)
    OR
    (geography_level='district' AND state_code IS NOT NULL AND district_code IS NOT NULL AND block_code IS NULL AND gram_panchayat_code IS NULL AND village_code IS NULL)
    OR
    (geography_level='block' AND state_code IS NOT NULL AND district_code IS NOT NULL AND block_code IS NOT NULL AND gram_panchayat_code IS NULL AND village_code IS NULL)
    OR
    (geography_level='gram_panchayat' AND state_code IS NOT NULL AND district_code IS NOT NULL AND block_code IS NOT NULL AND gram_panchayat_code IS NOT NULL AND village_code IS NULL)
    OR
    (geography_level='village' AND state_code IS NOT NULL AND district_code IS NOT NULL AND block_code IS NOT NULL AND village_code IS NOT NULL)
  ),
  UNIQUE(service_code,geography_level,state_code,district_code,block_code,gram_panchayat_code,village_code)
);

CREATE INDEX IF NOT EXISTS idx_ycm_service_geo_scope_lookup
  ON ycm_service_geography_scope(service_code,enabled,state_code,district_code,block_code,gram_panchayat_code,village_code);

COMMENT ON TABLE ycm_service_geography_scope IS
  'Optional entry-gate scope for unified YCM services. A service with no rows remains globally discoverable; scoped services require a matching geography.';
