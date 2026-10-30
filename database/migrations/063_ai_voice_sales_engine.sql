-- 063: AI voice sales campaigns, consent enforcement, outbound call queue and message audit.
-- This migration stores provider-neutral jobs only. It does not place calls by itself.
CREATE TABLE IF NOT EXISTS ycm_ai_contact_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
  channel VARCHAR(16) NOT NULL CHECK (channel IN ('voice','sms','whatsapp')),
  consent_status VARCHAR(16) NOT NULL CHECK (consent_status IN ('granted','withdrawn','unknown')),
  consent_source VARCHAR(80),
  consent_reference VARCHAR(160),
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, channel),
  CHECK ((consent_status <> 'granted') OR consented_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_ycm_ai_contact_preferences_allowed
  ON ycm_ai_contact_preferences(channel, consent_status, do_not_contact, lead_id);

CREATE TABLE IF NOT EXISTS ycm_ai_voice_campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(160) NOT NULL,
  service_code VARCHAR(120),
  script_key VARCHAR(120) NOT NULL,
  language_codes TEXT[] NOT NULL DEFAULT ARRAY['hi-IN'],
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','completed','cancelled')),
  daily_call_limit INTEGER NOT NULL DEFAULT 100 CHECK (daily_call_limit BETWEEN 1 AND 5000),
  max_attempts INTEGER NOT NULL DEFAULT 2 CHECK (max_attempts BETWEEN 1 AND 5),
  start_hour SMALLINT NOT NULL DEFAULT 10 CHECK (start_hour BETWEEN 0 AND 23),
  end_hour SMALLINT NOT NULL DEFAULT 18 CHECK (end_hour BETWEEN 1 AND 24),
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  created_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_hour > start_hour)
);

CREATE TABLE IF NOT EXISTS ycm_ai_voice_call_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ycm_ai_voice_campaigns(campaign_id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','scheduled','calling','completed','failed','cancelled','suppressed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_code VARCHAR(40),
  provider_call_id VARCHAR(160),
  outcome VARCHAR(32),
  transcript TEXT,
  summary TEXT,
  interested BOOLEAN,
  callback_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error_code VARCHAR(80),
  idempotency_key VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_ai_voice_jobs_queue
  ON ycm_ai_voice_call_jobs(status, scheduled_at) WHERE status IN ('queued','scheduled');
CREATE INDEX IF NOT EXISTS idx_ycm_ai_voice_jobs_lead
  ON ycm_ai_voice_call_jobs(lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ycm_ai_message_events (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES ycm_leads(lead_id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ycm_ai_voice_campaigns(campaign_id) ON DELETE SET NULL,
  channel VARCHAR(16) NOT NULL CHECK (channel IN ('sms','whatsapp')),
  template_key VARCHAR(120) NOT NULL,
  destination_hash VARCHAR(128) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','read','failed','suppressed')),
  provider_code VARCHAR(40),
  provider_message_id VARCHAR(160),
  failure_code VARCHAR(80),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_ai_message_events_lead
  ON ycm_ai_message_events(lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ycm_ai_voice_audit_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ycm_ai_voice_call_jobs(job_id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES ycm_ai_voice_campaigns(campaign_id) ON DELETE SET NULL,
  lead_id UUID REFERENCES ycm_leads(lead_id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  actor_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_ai_voice_audit_lead
  ON ycm_ai_voice_audit_events(lead_id, created_at DESC);
