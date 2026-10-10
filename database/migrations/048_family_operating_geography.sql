-- 048: family operating geography for deterministic case routing.
ALTER TABLE ycm_families
  ADD COLUMN IF NOT EXISTS state_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS district_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS block_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS gram_panchayat_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS village_code VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_ycm_families_geography
  ON ycm_families(state_code,district_code,block_code,gram_panchayat_code,village_code);
