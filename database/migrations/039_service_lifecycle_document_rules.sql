-- 039: service lifecycle, document validity/reuse and application prefill rules
ALTER TABLE ycm_service_master
  ADD COLUMN IF NOT EXISTS validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS expiry_warning_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS renewal_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS renewal_window_days INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS prefill_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE ycm_service_documents
  ADD COLUMN IF NOT EXISTS required_for_application BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS expiry_warning_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reuse_if_valid BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS reupload_on_expiry BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS prefill_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_name VARCHAR(240),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE;

CREATE INDEX IF NOT EXISTS idx_ycm_service_documents_application
  ON ycm_service_documents(service_code, required_for_application, reuse_if_valid);

ALTER TABLE ycm_family_documents
  ADD COLUMN IF NOT EXISTS sha256 TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_ycm_family_documents_reuse
  ON ycm_family_documents(family_id, member_id, document_type, status, valid_until);

CREATE TABLE IF NOT EXISTS ycm_service_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code),
  status VARCHAR(24) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','submitted','in_progress','completed','rejected','cancelled')),
  prefilled_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  document_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ycm_service_applications_family
  ON ycm_service_applications(family_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_service_applications_service
  ON ycm_service_applications(service_code, status, updated_at DESC);

COMMENT ON COLUMN ycm_service_master.validity_days IS 'Validity of the resulting service/certificate where applicable; null means authority-defined or not applicable.';
COMMENT ON COLUMN ycm_service_documents.reuse_if_valid IS 'Reuse a previously uploaded verified document when it is still valid for this service.';
COMMENT ON TABLE ycm_service_applications IS 'Unified Apply lifecycle: prefilled family/member data + reusable existing documents + explicit missing-document upload list.';
