CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ycm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(32) UNIQUE NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(320),
  mobile VARCHAR(20),
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  auth_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_users_role_check CHECK (role IN ('family','farmer','lawyer','student','employee','management','ceo','admin','partner','referral')),
  CONSTRAINT ycm_users_status_check CHECK (status IN ('active','pending','suspended','disabled'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ycm_users_email_uq ON ycm_users (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ycm_users_mobile_uq ON ycm_users (mobile) WHERE mobile IS NOT NULL;
CREATE INDEX IF NOT EXISTS ycm_users_user_id_idx ON ycm_users (user_id);

CREATE TABLE IF NOT EXISTS ycm_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_password_reset_tokens_lookup_idx ON ycm_password_reset_tokens (token_hash, expires_at);

CREATE OR REPLACE FUNCTION ycm_touch_users_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ycm_users_updated_at ON ycm_users;
CREATE TRIGGER ycm_users_updated_at BEFORE UPDATE ON ycm_users FOR EACH ROW EXECUTE FUNCTION ycm_touch_users_updated_at();
