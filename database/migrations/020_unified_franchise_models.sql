-- 020: Unified franchise network models
ALTER TABLE ycm_ceo_entities
  ADD COLUMN IF NOT EXISTS franchise_model VARCHAR(32),
  ADD COLUMN IF NOT EXISTS parent_entity_id UUID REFERENCES ycm_ceo_entities(entity_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS territory_code VARCHAR(128),
  ADD COLUMN IF NOT EXISTS service_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS agreement_start DATE,
  ADD COLUMN IF NOT EXISTS agreement_end DATE;

DO $$ BEGIN
  ALTER TABLE ycm_ceo_entities
    ADD CONSTRAINT ycm_ceo_entities_franchise_model_check
    CHECK (franchise_model IS NULL OR franchise_model IN ('store','gram_panchayat','block_hub','district_hub','partner_hub','master_franchise'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS ycm_ceo_entities_franchise_model_idx
ON ycm_ceo_entities(entity_type,franchise_model,status);

CREATE INDEX IF NOT EXISTS ycm_ceo_entities_parent_idx
ON ycm_ceo_entities(parent_entity_id);

CREATE TABLE IF NOT EXISTS ycm_franchise_models (
  model_code VARCHAR(32) PRIMARY KEY,
  model_name VARCHAR(120) NOT NULL,
  territory_level VARCHAR(32) NOT NULL CHECK (territory_level IN ('village','gram_panchayat','block','district','multi_district')),
  requires_physical_location BOOLEAN NOT NULL DEFAULT TRUE,
  default_service_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO ycm_franchise_models(model_code,model_name,territory_level,requires_physical_location,default_service_scope)
VALUES
('store','YCM Store Franchise','village',true,'["government","documents","education","finance","business","travel","digital"]'),
('gram_panchayat','YCM Gram Panchayat Mitra','gram_panchayat',true,'["government","documents","welfare","agriculture","education","digital"]'),
('block_hub','YCM Block Hub','block',true,'["all"]'),
('district_hub','YCM District Hub','district',true,'["all"]'),
('partner_hub','YCM Partner Hub','multi_district',true,'["all"]'),
('master_franchise','YCM Master Franchise','multi_district',true,'["all"]')
ON CONFLICT (model_code) DO UPDATE SET
 model_name=EXCLUDED.model_name,
 territory_level=EXCLUDED.territory_level,
 requires_physical_location=EXCLUDED.requires_physical_location,
 default_service_scope=EXCLUDED.default_service_scope;

CREATE TABLE IF NOT EXISTS ycm_franchise_service_scope (
  scope_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES ycm_ceo_entities(entity_id) ON DELETE CASCADE,
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  commission_rate NUMERIC(7,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id,service_code)
);

CREATE INDEX IF NOT EXISTS idx_ycm_franchise_scope_entity
ON ycm_franchise_service_scope(entity_id,enabled);

COMMENT ON TABLE ycm_franchise_models IS 'Canonical YCM franchise models. All franchise models share the same entity, service and case lifecycle.';
