-- 064: atomic daily voice quotas and idempotent provider webhook receipts.
-- Additive only; this migration does not enable live calling.
CREATE TABLE IF NOT EXISTS ycm_ai_voice_daily_usage (
 campaign_id UUID NOT NULL REFERENCES ycm_ai_voice_campaigns(campaign_id) ON DELETE CASCADE,
 local_date DATE NOT NULL,
 call_count INTEGER NOT NULL DEFAULT 0 CHECK(call_count BETWEEN 0 AND 5000),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(campaign_id,local_date)
);
CREATE TABLE IF NOT EXISTS ycm_ai_voice_webhook_events (
 receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_code VARCHAR(40) NOT NULL,
 provider_event_id VARCHAR(200) NOT NULL,
 job_id UUID REFERENCES ycm_ai_voice_call_jobs(job_id) ON DELETE SET NULL,
 event_type VARCHAR(64) NOT NULL,
 payload_sha256 CHAR(64) NOT NULL,
 received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 processed_at TIMESTAMPTZ,
 UNIQUE(provider_code,provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_ai_voice_webhook_job ON ycm_ai_voice_webhook_events(job_id,received_at DESC);
