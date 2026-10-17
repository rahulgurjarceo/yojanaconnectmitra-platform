-- 054: lead call outcomes, employee daily quotas and manager transfer controls
ALTER TABLE ycm_leads
  ADD COLUMN IF NOT EXISTS call_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calls_received INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calls_missed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_call_outcome VARCHAR(24),
  ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;
ALTER TABLE ycm_leads DROP CONSTRAINT IF EXISTS ycm_leads_last_call_outcome_check;
ALTER TABLE ycm_leads ADD CONSTRAINT ycm_leads_last_call_outcome_check CHECK (last_call_outcome IS NULL OR last_call_outcome IN ('connected','no_answer','busy','switched_off','invalid_number','callback','not_interested','employee_hangup','customer_hangup'));
CREATE TABLE IF NOT EXISTS ycm_lead_call_attempts (
 call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
 employee_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL, outcome VARCHAR(24) NOT NULL CHECK (outcome IN ('connected','no_answer','busy','switched_off','invalid_number','callback','not_interested','employee_hangup','customer_hangup')),
 duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0), notes TEXT, called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_ycm_lead_call_attempts_employee_day ON ycm_lead_call_attempts(employee_user_id,called_at);
CREATE INDEX IF NOT EXISTS idx_ycm_lead_call_attempts_lead ON ycm_lead_call_attempts(lead_id,called_at DESC);
CREATE TABLE IF NOT EXISTS ycm_lead_daily_distribution (
 distribution_date DATE NOT NULL, employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
 target_count INTEGER NOT NULL DEFAULT 200 CHECK (target_count > 0), distributed_count INTEGER NOT NULL DEFAULT 0,
 called_count INTEGER NOT NULL DEFAULT 0, connected_count INTEGER NOT NULL DEFAULT 0, no_answer_count INTEGER NOT NULL DEFAULT 0, employee_hangup_count INTEGER NOT NULL DEFAULT 0, customer_hangup_count INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(distribution_date,employee_user_id));
CREATE TABLE IF NOT EXISTS ycm_lead_daily_settings (
 setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key VARCHAR(80) UNIQUE NOT NULL,
 target_per_day INTEGER NOT NULL DEFAULT 200 CHECK (target_per_day > 0), active BOOLEAN NOT NULL DEFAULT true,
 updated_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO ycm_lead_daily_settings(setting_key,target_per_day) VALUES('default_employee_daily_target',200)
ON CONFLICT(setting_key) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_ycm_lead_daily_distribution_date ON ycm_lead_daily_distribution(distribution_date);
