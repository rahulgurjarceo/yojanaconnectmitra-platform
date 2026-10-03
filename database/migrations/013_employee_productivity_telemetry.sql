CREATE TABLE IF NOT EXISTS ycm_employee_presence (
  presence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ NOT NULL,
  logout_at TIMESTAMPTZ,
  source VARCHAR(24) NOT NULL DEFAULT 'web',
  ip_hash TEXT,
  device_ref TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_employee_presence_status_check CHECK (status IN ('open','closed','forced_closed'))
);
CREATE INDEX IF NOT EXISTS ycm_employee_presence_employee_idx ON ycm_employee_presence(employee_user_id,login_at DESC);

CREATE TABLE IF NOT EXISTS ycm_employee_activity (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  activity_type VARCHAR(48) NOT NULL,
  resource_type VARCHAR(48),
  resource_id VARCHAR(128),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  result VARCHAR(32),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS ycm_employee_activity_employee_idx ON ycm_employee_activity(employee_user_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS ycm_employee_activity_type_idx ON ycm_employee_activity(activity_type,occurred_at DESC);

CREATE TABLE IF NOT EXISTS ycm_employee_calls (
  call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  provider VARCHAR(48) NOT NULL,
  provider_call_id VARCHAR(160),
  direction VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  contact_ref TEXT,
  recording_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ycm_employee_calls_direction_check CHECK (direction IN ('inbound','outbound')),
  CONSTRAINT ycm_employee_calls_status_check CHECK (status IN ('answered','missed','rejected','disconnected','failed','busy','ringing'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ycm_employee_calls_provider_id_uq ON ycm_employee_calls(provider,provider_call_id) WHERE provider_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ycm_employee_calls_employee_date_idx ON ycm_employee_calls(employee_user_id,started_at DESC);

CREATE TABLE IF NOT EXISTS ycm_employee_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  provider VARCHAR(48) NOT NULL,
  provider_message_id VARCHAR(160),
  direction VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL,
  recipient_ref TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  template_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ycm_employee_messages_direction_check CHECK (direction IN ('inbound','outbound')),
  CONSTRAINT ycm_employee_messages_status_check CHECK (status IN ('sent','delivered','read','failed','received'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ycm_employee_messages_provider_id_uq ON ycm_employee_messages(provider,provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ycm_employee_messages_employee_date_idx ON ycm_employee_messages(employee_user_id,sent_at DESC);

CREATE TABLE IF NOT EXISTS ycm_employee_leave (
  leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  leave_type VARCHAR(32) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_employee_leave_status_check CHECK (status IN ('pending','approved','rejected','cancelled'))
);
CREATE INDEX IF NOT EXISTS ycm_employee_leave_employee_date_idx ON ycm_employee_leave(employee_user_id,start_date DESC);

CREATE TABLE IF NOT EXISTS ycm_employee_daily_kpi (
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  tasks_assigned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  applications_processed INTEGER NOT NULL DEFAULT 0,
  customers_served INTEGER NOT NULL DEFAULT 0,
  calls_answered INTEGER NOT NULL DEFAULT 0,
  calls_outbound INTEGER NOT NULL DEFAULT 0,
  calls_disconnected INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  login_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(employee_user_id,metric_date)
);
