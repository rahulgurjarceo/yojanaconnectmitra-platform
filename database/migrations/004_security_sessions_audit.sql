-- YCM ONE security persistence
-- Run after the existing family/payment migrations.

CREATE TABLE IF NOT EXISTS ycm_revoked_sessions (
  session_id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_revoked_sessions_expires_at
  ON ycm_revoked_sessions (expires_at);

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

CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_created_at
  ON ycm_security_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_subject
  ON ycm_security_audit_events (subject, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_family
  ON ycm_security_audit_events (family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_security_audit_session
  ON ycm_security_audit_events (session_id, created_at DESC);

-- Audit records are append-only by application policy: no UPDATE/DELETE API
-- should be exposed to ordinary application roles.
