-- 015: durable organization hierarchy and Team Lead role
ALTER TABLE ycm_users DROP CONSTRAINT IF EXISTS ycm_users_role_check;
ALTER TABLE ycm_users ADD CONSTRAINT ycm_users_role_check CHECK (role IN ('family','farmer','lawyer','student','employee','team_lead','management','ceo','admin','partner','referral'));
ALTER TABLE ycm_teams DROP CONSTRAINT IF EXISTS ycm_teams_manager_role_check;
ALTER TABLE ycm_teams ADD CONSTRAINT ycm_teams_manager_role_check CHECK (manager_user_id IS NULL OR EXISTS (SELECT 1 FROM ycm_users u WHERE u.id=manager_user_id AND u.role IN ('team_lead','management','ceo','admin')));
