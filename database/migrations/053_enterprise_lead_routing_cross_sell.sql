-- 053: Enterprise lead routing, SLA recycling and cross-sell recommendations
ALTER TABLE ycm_leads
  ADD COLUMN IF NOT EXISTS lead_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assignment_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE ycm_leads DROP CONSTRAINT IF EXISTS ycm_leads_status_check;
ALTER TABLE ycm_leads ADD CONSTRAINT ycm_leads_status_check CHECK (status IN ('new','qualified','assigned','in_progress','contacted','follow_up','converted','lost','closed'));
ALTER TABLE ycm_leads DROP CONSTRAINT IF EXISTS ycm_leads_priority_check;
ALTER TABLE ycm_leads ADD CONSTRAINT ycm_leads_priority_check CHECK (priority IN ('low','normal','high','urgent'));
CREATE TABLE IF NOT EXISTS ycm_lead_routing_rules (
 rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rule_name VARCHAR(160) NOT NULL, priority INTEGER NOT NULL DEFAULT 100,
 active BOOLEAN NOT NULL DEFAULT true, source_code VARCHAR(80), service_code VARCHAR(120), state_code VARCHAR(16), district_code VARCHAR(64),
 team_id UUID REFERENCES ycm_teams(team_id) ON DELETE SET NULL,
 strategy VARCHAR(32) NOT NULL DEFAULT 'round_robin' CHECK (strategy IN ('round_robin','least_loaded','skill_match','performance')),
 sla_minutes INTEGER NOT NULL DEFAULT 30, max_attempts INTEGER NOT NULL DEFAULT 3, config JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_ycm_lead_routing_rules_active ON ycm_lead_routing_rules(active,priority);
CREATE TABLE IF NOT EXISTS ycm_lead_assignments (
 assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
 assignee_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL, rule_id UUID REFERENCES ycm_lead_routing_rules(rule_id) ON DELETE SET NULL,
 sequence_no INTEGER NOT NULL DEFAULT 1, assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), accepted_at TIMESTAMPTZ,
 completed_at TIMESTAMPTZ, released_at TIMESTAMPTZ, release_reason VARCHAR(120), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_ycm_lead_assignments_lead ON ycm_lead_assignments(lead_id,sequence_no DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_lead_assignments_assignee ON ycm_lead_assignments(assignee_user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ycm_lead_cross_sell_recommendations (
 recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
 service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE, score NUMERIC(6,2) NOT NULL DEFAULT 0,
 reason TEXT NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended','offered','interested','rejected','converted','dismissed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(lead_id,service_code));
CREATE INDEX IF NOT EXISTS idx_ycm_lead_cross_sell_lead ON ycm_lead_cross_sell_recommendations(lead_id,status,score DESC);
CREATE TABLE IF NOT EXISTS ycm_lead_routing_events (
 event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
 from_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL, to_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
 event_type VARCHAR(64) NOT NULL, reason TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_ycm_lead_routing_events_lead ON ycm_lead_routing_events(lead_id,created_at DESC);
