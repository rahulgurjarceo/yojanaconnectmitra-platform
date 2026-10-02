CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS ycm_impact_records (
 impact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), family_id TEXT NULL, member_id TEXT NULL, case_id TEXT NULL,
 state_code TEXT NOT NULL, district_code TEXT NOT NULL, block_code TEXT NOT NULL, village_code TEXT NULL,
 outcome_type TEXT NOT NULL CHECK (outcome_type IN ('education_enrollment','education_improvement','scholarship_access','employment','skill_completion','government_service_access','document_completion','financial_inclusion','agriculture_outcome','health_welfare_referral')),
 baseline_value NUMERIC NULL, current_value NUMERIC NULL, unit TEXT NULL, baseline_date DATE NULL, outcome_date DATE NULL,
 verified BOOLEAN NOT NULL DEFAULT FALSE, verification_method TEXT NULL, consent_captured BOOLEAN NOT NULL DEFAULT FALSE,
 created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_impact_geo ON ycm_impact_records(state_code,district_code,block_code,village_code);
CREATE INDEX IF NOT EXISTS idx_ycm_impact_outcome ON ycm_impact_records(outcome_type,verified);
CREATE TABLE IF NOT EXISTS ycm_impact_evidence (
 evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), impact_id UUID NOT NULL REFERENCES ycm_impact_records(impact_id) ON DELETE CASCADE,
 evidence_type TEXT NOT NULL, source_ref TEXT NOT NULL, source_hash TEXT NULL, captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), verified_by TEXT NULL,
 consent_scope TEXT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ycm_impact_evidence_impact ON ycm_impact_evidence(impact_id);
CREATE TABLE IF NOT EXISTS ycm_impact_audit (
 audit_id BIGSERIAL PRIMARY KEY, impact_id UUID NULL REFERENCES ycm_impact_records(impact_id) ON DELETE SET NULL,
 actor_id TEXT NOT NULL, action TEXT NOT NULL, before_data JSONB NULL, after_data JSONB NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_impact_audit_impact ON ycm_impact_audit(impact_id,created_at DESC);
