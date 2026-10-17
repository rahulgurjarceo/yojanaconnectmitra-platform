-- 049: unified document validity, KYC renewal and compliance reminders
CREATE TABLE IF NOT EXISTS ycm_document_validity_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(120) NOT NULL,
  context_type VARCHAR(32) NOT NULL DEFAULT 'service'
    CHECK (context_type IN ('service','channel','authority','general')),
  context_code VARCHAR(160),
  validity_days INTEGER CHECK (validity_days IS NULL OR validity_days > 0),
  validity_basis VARCHAR(32) NOT NULL DEFAULT 'fixed_days'
    CHECK (validity_basis IN ('fixed_days','application_deadline','event_date','authority_rule','manual')),
  requires_before_deadline BOOLEAN NOT NULL DEFAULT FALSE,
  warning_days INTEGER NOT NULL DEFAULT 30 CHECK (warning_days >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_type,context_type,context_code)
);
CREATE INDEX IF NOT EXISTS idx_ycm_document_validity_lookup
  ON ycm_document_validity_rules(document_type,context_type,context_code,active);

ALTER TABLE ycm_service_documents
  ADD COLUMN IF NOT EXISTS validity_rule_id UUID REFERENCES ycm_document_validity_rules(rule_id) ON DELETE SET NULL;

ALTER TABLE ycm_family_documents
  ADD COLUMN IF NOT EXISTS validity_rule_id UUID REFERENCES ycm_document_validity_rules(rule_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validity_basis VARCHAR(32),
  ADD COLUMN IF NOT EXISTS validity_warning_days INTEGER NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS ycm_compliance_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE CASCADE,
  document_id UUID REFERENCES ycm_family_documents(document_id) ON DELETE SET NULL,
  verification_id UUID REFERENCES ycm_identity_verifications(verification_id) ON DELETE SET NULL,
  requirement_type VARCHAR(32) NOT NULL CHECK (requirement_type IN ('document','kyc')),
  requirement_code VARCHAR(120) NOT NULL,
  title VARCHAR(240) NOT NULL,
  frequency_days INTEGER CHECK (frequency_days IS NULL OR frequency_days > 0),
  last_completed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ NOT NULL,
  warning_days INTEGER NOT NULL DEFAULT 30 CHECK (warning_days >= 0),
  status VARCHAR(24) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','due','overdue','completed','paused','cancelled')),
  assigned_employee_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  assigned_manager_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_compliance_schedule_family
  ON ycm_compliance_schedules(family_id,status,next_due_at);
CREATE INDEX IF NOT EXISTS idx_ycm_compliance_schedule_due
  ON ycm_compliance_schedules(status,next_due_at);
CREATE INDEX IF NOT EXISTS idx_ycm_compliance_schedule_employee
  ON ycm_compliance_schedules(assigned_employee_id,status,next_due_at);
CREATE INDEX IF NOT EXISTS idx_ycm_compliance_schedule_manager
  ON ycm_compliance_schedules(assigned_manager_id,status,next_due_at);

CREATE TABLE IF NOT EXISTS ycm_compliance_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES ycm_compliance_schedules(schedule_id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES ycm_users(id) ON DELETE CASCADE,
  recipient_family_id TEXT REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  channel VARCHAR(24) NOT NULL DEFAULT 'in_app'
    CHECK (channel IN ('in_app','email','whatsapp','sms')),
  reminder_kind VARCHAR(24) NOT NULL CHECK (reminder_kind IN ('upcoming','due','overdue','missing')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_compliance_reminders_queue
  ON ycm_compliance_reminders(status,scheduled_for);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ycm_compliance_reminder_once
  ON ycm_compliance_reminders(schedule_id,COALESCE(recipient_user_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(recipient_family_id,''),channel,reminder_kind,scheduled_for);

CREATE OR REPLACE FUNCTION ycm_refresh_compliance_schedule_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('completed','paused','cancelled') THEN
    NEW.status := CASE
      WHEN NEW.next_due_at < NOW() THEN 'overdue'
      WHEN NEW.next_due_at <= NOW() + (NEW.warning_days || ' days')::interval THEN 'due'
      ELSE 'active'
    END;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ycm_compliance_schedule_status ON ycm_compliance_schedules;
CREATE TRIGGER trg_ycm_compliance_schedule_status
BEFORE INSERT OR UPDATE OF next_due_at,status,warning_days ON ycm_compliance_schedules
FOR EACH ROW EXECUTE FUNCTION ycm_refresh_compliance_schedule_status();

COMMENT ON TABLE ycm_document_validity_rules IS 'Context-specific validity rules: fixed 6/12/24 months, authority-defined, or application-deadline based.';
COMMENT ON TABLE ycm_compliance_schedules IS 'Unified recurring document/KYC due-date engine shared by customers, employees, leads and managers.';
COMMENT ON TABLE ycm_compliance_reminders IS 'Durable reminder queue for upcoming, due, overdue and missing compliance requirements.';
