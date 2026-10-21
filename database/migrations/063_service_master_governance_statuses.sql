-- 063: Align service master status constraints with the governed draft -> approval -> publish lifecycle.
-- Keep legacy active/inactive values readable while enabling the canonical governance states.
ALTER TABLE ycm_service_master
  DROP CONSTRAINT IF EXISTS ycm_service_master_status_check;

ALTER TABLE ycm_service_master
  ADD CONSTRAINT ycm_service_master_status_check
  CHECK (status IN ('active','inactive','draft','pending_approval','published','paused','archived'));

COMMENT ON COLUMN ycm_service_master.status IS
  'Legacy active/inactive remain supported; governed records move draft -> pending_approval -> published, then paused or archived.';
