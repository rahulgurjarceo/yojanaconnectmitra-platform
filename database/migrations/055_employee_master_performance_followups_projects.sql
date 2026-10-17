-- 055: unified employee master, follow-ups, projects, performance snapshots and promotion readiness
CREATE TABLE IF NOT EXISTS ycm_employee_followups (
 followup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
 lead_id UUID REFERENCES ycm_leads(lead_id) ON DELETE SET NULL, followup_type VARCHAR(24) NOT NULL DEFAULT 'callback' CHECK (followup_type IN ('callback','follow_up','task','renewal','document','payment')),
 due_at TIMESTAMPTZ NOT NULL, priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
 status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','overdue','cancelled')), outcome VARCHAR(32), notes TEXT,
 completed_at TIMESTAMPTZ, created_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_followups_employee_due ON ycm_employee_followups(employee_user_id,status,due_at);
CREATE TABLE IF NOT EXISTS ycm_employee_projects (
 project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_code VARCHAR(64) UNIQUE NOT NULL, project_name VARCHAR(200) NOT NULL, description TEXT,
 owner_user_id UUID REFERENCES ycm_users(id) ON DELETE SET NULL, status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','blocked','completed','cancelled')),
 priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')), start_date DATE, due_date DATE, completed_at DATE,
 completion_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100), created_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ycm_employee_project_members (
 project_id UUID NOT NULL REFERENCES ycm_employee_projects(project_id) ON DELETE CASCADE, employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
 responsibility VARCHAR(160), target_value NUMERIC(14,2), actual_value NUMERIC(14,2), status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','removed')), assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(project_id,employee_user_id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_project_members_employee ON ycm_employee_project_members(employee_user_id,status);
CREATE TABLE IF NOT EXISTS ycm_employee_performance_monthly (
 employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE, month_start DATE NOT NULL,
 leads_handled NUMERIC(14,2) NOT NULL DEFAULT 0, calls_made NUMERIC(14,2) NOT NULL DEFAULT 0, calls_connected NUMERIC(14,2) NOT NULL DEFAULT 0,
 followups_completed NUMERIC(14,2) NOT NULL DEFAULT 0, callbacks_completed NUMERIC(14,2) NOT NULL DEFAULT 0, applications_completed NUMERIC(14,2) NOT NULL DEFAULT 0,
 conversions NUMERIC(14,2) NOT NULL DEFAULT 0, revenue NUMERIC(14,2) NOT NULL DEFAULT 0, commission NUMERIC(14,2) NOT NULL DEFAULT 0,
 quality_score NUMERIC(6,2) NOT NULL DEFAULT 0, attendance_score NUMERIC(6,2) NOT NULL DEFAULT 0, customer_feedback_score NUMERIC(6,2) NOT NULL DEFAULT 0,
 performance_score NUMERIC(6,2) NOT NULL DEFAULT 0, salary_snapshot NUMERIC(14,2) NOT NULL DEFAULT 0,
 promotion_readiness VARCHAR(20) NOT NULL DEFAULT 'developing' CHECK (promotion_readiness IN ('not_ready','developing','ready','strong_candidate')),
 manager_note TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(employee_user_id,month_start)
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_performance_month ON ycm_employee_performance_monthly(month_start,performance_score DESC);
CREATE TABLE IF NOT EXISTS ycm_employee_performance_weights (
 weight_code VARCHAR(40) PRIMARY KEY, weight_percent NUMERIC(6,2) NOT NULL CHECK (weight_percent >= 0 AND weight_percent <= 100), active BOOLEAN NOT NULL DEFAULT TRUE,
 updated_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO ycm_employee_performance_weights(weight_code,weight_percent) VALUES ('lead_handling',20),('conversion',20),('followup_discipline',15),('application_completion',15),('revenue',10),('quality_sla',10),('attendance',5),('customer_feedback',5) ON CONFLICT(weight_code) DO NOTHING;
CREATE TABLE IF NOT EXISTS ycm_employee_promotions (
 promotion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE, from_role VARCHAR(48), to_role VARCHAR(48), effective_date DATE,
 reason TEXT, performance_score NUMERIC(6,2), status VARCHAR(16) NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended','approved','rejected','applied')), approved_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_promotions_employee ON ycm_employee_promotions(employee_user_id,created_at DESC);