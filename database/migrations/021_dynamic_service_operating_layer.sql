-- 021: Dynamic service operating layer for YCM One
CREATE TABLE IF NOT EXISTS ycm_business_verticals (
  vertical_code VARCHAR(80) PRIMARY KEY,
  vertical_name VARCHAR(160) NOT NULL,
  description TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO ycm_business_verticals(vertical_code,vertical_name,description) VALUES
('government','Government & Citizen Services','Government and citizen service delivery.'),
('documents','Documents & Verification','Identity, certificates, OCR and document workflows.'),
('education','Education & Career','Education, scholarship, skills and employment.'),
('finance','Finance & Insurance','Loans, banking, insurance and regulated financial routing.'),
('travel','Travel & Immigration','Passport, visa, flight, hotel and travel workflows.'),
('business','Business & Professional','MSME, tax, legal, professional and corporate services.'),
('agriculture','Agriculture & Rural Economy','Farmer, FPO, dairy and rural business services.'),
('digital','Digital & Utility','Digital, utility, telecom and assisted online services.'),
('social','Social & Welfare','Welfare, women, children, seniors and disability services.'),
('international','International Services','Cross-border citizen, education and employment services.')
ON CONFLICT (vertical_code) DO UPDATE SET
 vertical_name=EXCLUDED.vertical_name,
 description=EXCLUDED.description;

CREATE TABLE IF NOT EXISTS ycm_service_verticals (
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  vertical_code VARCHAR(80) NOT NULL REFERENCES ycm_business_verticals(vertical_code) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  PRIMARY KEY(service_code,vertical_code)
);

CREATE INDEX IF NOT EXISTS idx_ycm_service_verticals_vertical
ON ycm_service_verticals(vertical_code,status);

CREATE TABLE IF NOT EXISTS ycm_service_providers (
  provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code VARCHAR(120) NOT NULL UNIQUE,
  provider_name VARCHAR(240) NOT NULL,
  provider_type VARCHAR(32) NOT NULL CHECK (provider_type IN ('government','api','payment','travel','professional','internal','partner','other')),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','sandbox')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ycm_service_provider_links (
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES ycm_service_providers(provider_id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  commission_rate NUMERIC(7,3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY(service_code,provider_id)
);

CREATE TABLE IF NOT EXISTS ycm_service_workflows (
  workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_code,version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ycm_service_workflows_active
ON ycm_service_workflows(service_code) WHERE status='active';

CREATE TABLE IF NOT EXISTS ycm_service_documents (
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  document_code VARCHAR(120) NOT NULL,
  document_name VARCHAR(240) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  validation_mode VARCHAR(32) NOT NULL DEFAULT 'manual' CHECK (validation_mode IN ('manual','ocr','api','provider','none')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY(service_code,document_code)
);

CREATE TABLE IF NOT EXISTS ycm_service_pricing (
  pricing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(120) NOT NULL REFERENCES ycm_service_master(service_code) ON DELETE CASCADE,
  channel VARCHAR(32) NOT NULL DEFAULT 'assisted',
  customer_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (customer_price >= 0),
  provider_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (provider_cost >= 0),
  commission_rate NUMERIC(7,3),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ycm_service_pricing_lookup
ON ycm_service_pricing(service_code,channel,status,effective_from DESC);

COMMENT ON TABLE ycm_business_verticals IS 'Business verticals are orthogonal to the 35 canonical YCM service domains.';
COMMENT ON TABLE ycm_service_providers IS 'Provider registry. Credentials/secrets must remain in environment or a secret manager, never this table.';
COMMENT ON TABLE ycm_service_workflows IS 'Config-driven service workflow definitions executed by the common YCM case lifecycle.';
COMMENT ON TABLE ycm_service_documents IS 'Service-specific document requirements and validation modes.';
COMMENT ON TABLE ycm_service_pricing IS 'Service pricing and unit economics configuration.';
