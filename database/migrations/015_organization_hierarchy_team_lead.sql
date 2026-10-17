-- 015: durable organization hierarchy and Team Lead role
ALTER TABLE ycm_users DROP CONSTRAINT IF EXISTS ycm_users_role_check;
ALTER TABLE ycm_users ADD CONSTRAINT ycm_users_role_check CHECK (role IN ('family','farmer','lawyer','student','employee','team_lead','management','ceo','admin','partner','referral'));
-- Team hierarchy already uses ycm_teams.manager_user_id. Manager role validation stays in application RBAC because PostgreSQL CHECK constraints cannot contain subqueries.
CREATE INDEX IF NOT EXISTS idx_ycm_users_team_lead ON ycm_users(role, status) WHERE role='team_lead';
