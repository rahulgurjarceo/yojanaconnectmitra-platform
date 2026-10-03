-- 031: Login brute-force rate limiting
-- Canonical production migration. Keeps login attempt counters server-side
-- so limits cannot be bypassed by changing browser state.
CREATE TABLE IF NOT EXISTS ycm_auth_login_attempts (
  key_hash VARCHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ycm_auth_login_attempts_window_idx
  ON ycm_auth_login_attempts (window_started_at);

-- Retain only recent buckets; the limiter itself remains bounded without cron.
DELETE FROM ycm_auth_login_attempts
WHERE window_started_at < NOW() - INTERVAL '24 hours';
