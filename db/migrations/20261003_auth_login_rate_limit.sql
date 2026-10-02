-- Login brute-force protection: short rolling window keyed by normalized identifier + client address.
CREATE TABLE IF NOT EXISTS ycm_auth_login_attempts (
  key_hash VARCHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ycm_auth_login_attempts_window_idx ON ycm_auth_login_attempts(window_started_at);
DELETE FROM ycm_auth_login_attempts WHERE window_started_at < NOW() - INTERVAL '24 hours';