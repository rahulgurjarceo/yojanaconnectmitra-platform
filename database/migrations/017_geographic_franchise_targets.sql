-- 017: geographic and franchise target hierarchy
ALTER TABLE ycm_org_targets
  DROP CONSTRAINT IF EXISTS ycm_org_targets_target_type_check;
ALTER TABLE ycm_org_targets
  ADD CONSTRAINT ycm_org_targets_target_type_check
  CHECK (target_type IN ('company','state','district','block','franchise','team','employee'));

ALTER TABLE ycm_org_targets
  ADD COLUMN IF NOT EXISTS state_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS district_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS block_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS franchise_entity_id UUID REFERENCES ycm_ceo_entities(entity_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_type VARCHAR(40);

ALTER TABLE ycm_teams
  ADD COLUMN IF NOT EXISTS state_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS district_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS block_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS franchise_entity_id UUID REFERENCES ycm_ceo_entities(entity_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ycm_org_targets_geo
  ON ycm_org_targets(state_code, district_code, block_code, target_type, status);

CREATE INDEX IF NOT EXISTS idx_ycm_org_targets_franchise
  ON ycm_org_targets(franchise_entity_id, status);

CREATE INDEX IF NOT EXISTS idx_ycm_teams_geo_type
  ON ycm_teams(state_code, district_code, block_code, team_type, status);

COMMENT ON COLUMN ycm_org_targets.target_type IS
  'Authority hierarchy: company -> state -> district -> block -> franchise -> team -> employee';
