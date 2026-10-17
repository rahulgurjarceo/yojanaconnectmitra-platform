CREATE TABLE IF NOT EXISTS ycm_employee_compensation (
  employee_user_id UUID PRIMARY KEY REFERENCES ycm_users(id) ON DELETE CASCADE,
  monthly_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
  salary_currency CHAR(3) NOT NULL DEFAULT 'INR',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_employee_compensation_status_check CHECK (status IN ('active','inactive'))
);
CREATE TABLE IF NOT EXISTS ycm_employee_targets (
  target_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  metric_code VARCHAR(48) NOT NULL,
  target_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit VARCHAR(24) NOT NULL DEFAULT 'count',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_user_id,metric_code,period_start,period_end),
  CONSTRAINT ycm_employee_targets_status_check CHECK (status IN ('active','closed','cancelled'))
);
CREATE INDEX IF NOT EXISTS ycm_employee_targets_employee_period_idx ON ycm_employee_targets(employee_user_id,period_start DESC,period_end DESC);
CREATE TABLE IF NOT EXISTS ycm_employee_commission (
  commission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  reference_type VARCHAR(48) NOT NULL,
  reference_id VARCHAR(128),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ycm_employee_commission_status_check CHECK (status IN ('pending','approved','paid','reversed'))
);
CREATE INDEX IF NOT EXISTS ycm_employee_commission_employee_date_idx ON ycm_employee_commission(employee_user_id,earned_at DESC);
CREATE TABLE IF NOT EXISTS ycm_employee_attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  worked_seconds INTEGER NOT NULL DEFAULT 0,
  source VARCHAR(24) NOT NULL DEFAULT 'web',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(employee_user_id,attendance_date),
  CONSTRAINT ycm_employee_attendance_status_check CHECK (status IN ('present','absent','half_day','leave','holiday','week_off'))
);
CREATE INDEX IF NOT EXISTS ycm_employee_attendance_employee_date_idx ON ycm_employee_attendance(employee_user_id,attendance_date DESC);
