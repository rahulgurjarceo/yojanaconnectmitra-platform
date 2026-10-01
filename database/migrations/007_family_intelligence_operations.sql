-- YCM ONE operations: OCR/document intelligence + hierarchical work distribution.
CREATE TABLE IF NOT EXISTS ycm_teams (
  team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  team_type VARCHAR(40) NOT NULL CHECK (team_type IN ('sales','operations','document','field','support','legal','education','finance','custom')),
  parent_team_id UUID REFERENCES ycm_teams(team_id) ON DELETE SET NULL,
  manager_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_teams_parent ON ycm_teams(parent_team_id);
CREATE INDEX IF NOT EXISTS idx_ycm_teams_manager ON ycm_teams(manager_user_id);
CREATE TABLE IF NOT EXISTS ycm_work_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  case_id UUID REFERENCES ycm_family_cases(case_id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('family','case','document','lead','task')),
  source_id TEXT NOT NULL, assigned_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES ycm_users(id) ON DELETE SET NULL, team_id UUID REFERENCES ycm_teams(team_id) ON DELETE SET NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status VARCHAR(24) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','accepted','in_progress','blocked','completed','reassigned')),
  reason TEXT, due_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_assignments_family ON ycm_work_assignments(family_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_assignments_assignee ON ycm_work_assignments(assigned_to, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_assignments_team ON ycm_work_assignments(team_id, status, updated_at DESC);
CREATE TABLE IF NOT EXISTS ycm_document_intelligence (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE CASCADE, member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  document_type VARCHAR(80) NOT NULL, document_version VARCHAR(40), storage_ref TEXT, sha256 TEXT,
  ocr_provider VARCHAR(80), ocr_status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending','processing','completed','failed','manual_review')),
  extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb, field_confidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','verified','mismatch','manual_review')),
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb, consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_docintel_family ON ycm_document_intelligence(family_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_docintel_status ON ycm_document_intelligence(ocr_status, validation_status);
CREATE TABLE IF NOT EXISTS ycm_requirement_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), country CHAR(2) NOT NULL DEFAULT 'IN', state_code VARCHAR(16),
  service_domain VARCHAR(120) NOT NULL, service_code VARCHAR(160) NOT NULL,
  requirement_type VARCHAR(32) NOT NULL CHECK (requirement_type IN ('document','kyc','verification','consent','payment')),
  document_type VARCHAR(80), member_condition JSONB NOT NULL DEFAULT '{}'::jsonb, condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority SMALLINT NOT NULL DEFAULT 100, valid_from DATE, valid_to DATE, source_name VARCHAR(240), source_url TEXT, source_checked_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_requirement_lookup ON ycm_requirement_rules(country, state_code, service_code, status, priority);
CREATE TABLE IF NOT EXISTS ycm_family_requirement_status (
  requirement_status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL, service_code VARCHAR(160) NOT NULL,
  rule_id UUID REFERENCES ycm_requirement_rules(rule_id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('verified','valid','required','action_required','missing','re_kyc','expired','submitted','pending_authority')),
  reason_code VARCHAR(64), reason TEXT, next_action TEXT, due_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_family_req_status ON ycm_family_requirement_status(family_id, member_id, service_code, status);
CREATE TABLE IF NOT EXISTS ycm_document_audit_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID REFERENCES ycm_document_intelligence(document_id) ON DELETE CASCADE,
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE CASCADE, actor_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_doc_audit_document ON ycm_document_audit_events(document_id, created_at DESC);
