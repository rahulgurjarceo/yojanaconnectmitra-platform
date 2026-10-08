-- 054: voice form field guidance for service-driven forms
CREATE TABLE IF NOT EXISTS ycm_service_form_fields (
 field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
 field_key VARCHAR(120) NOT NULL,
 field_label VARCHAR(240) NOT NULL,
 voice_prompt_hi TEXT,
 voice_prompt_en TEXT,
 field_type VARCHAR(32) NOT NULL DEFAULT 'text',
 required BOOLEAN NOT NULL DEFAULT TRUE,
 sequence_no INTEGER NOT NULL DEFAULT 0,
 options JSONB NOT NULL DEFAULT '[]'::jsonb,
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(service_code,field_key)
);
CREATE INDEX IF NOT EXISTS idx_ycm_service_form_fields_service ON ycm_service_form_fields(service_code,sequence_no);
