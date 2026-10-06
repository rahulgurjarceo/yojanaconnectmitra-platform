-- 047: deterministic case dispatch and SLA routing.
-- Customer work must enter one queue and be routed by service/domain/team policy,
-- not by ad-hoc personal selection.

CREATE TABLE IF NOT EXISTS ycm_case_routing_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(120) REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  business_domain_code VARCHAR(120) REFERENCES ycm_business_domains(domain_code) ON DELETE CASCADE,
  state_code VARCHAR(32),
  district_code VARCHAR(32),
  block_code VARCHAR(32),
  team_id UUID NOT NULL REFERENCES ycm_teams(team_id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0),
  sla_minutes INTEGER NOT NULL DEFAULT 1440 CHECK (sla_minutes > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (service_code IS NOT NULL OR business_domain_code IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ycm_case_routing_lookup
  ON ycm_case_routing_rules(service_code,business_domain_code,state_code,district_code,block_code,active,priority);

CREATE INDEX IF NOT EXISTS idx_ycm_case_routing_team
  ON ycm_case_routing_rules(team_id,active);

COMMENT ON TABLE ycm_case_routing_rules IS
  'Deterministic routing policy for assigning customer cases to the correct functional team with an explicit SLA.';