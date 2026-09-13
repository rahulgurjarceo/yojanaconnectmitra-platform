-- YCM ONE security persistence migration
-- Apply after the existing customer-family PostgreSQL schema.

CREATE TABLE IF NOT EXISTS ycm_security_audit_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  subject TEXT NOT NULL,
  role TEXT NOT NULL,
  session_id TEXT,
  family_id TEXT,
  employee_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_events_created_at
  ON ycm_security_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_events_session_id
  ON ycm_security_audit_events (session_id);
CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_events_family_id
  ON ycm_security_audit_events (family_id);
CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_events_employee_id
  ON ycm_security_audit_events (employee_id);

CREATE TABLE IF NOT EXISTS ycm_revoked_sessions (
  session_id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_revoked_sessions_expires_at
  ON ycm_revoked_sessions (expires_at);
