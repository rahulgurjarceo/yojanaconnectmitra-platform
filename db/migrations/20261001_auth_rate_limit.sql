CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ycm_password_reset_attempts (
  key_hash VARCHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ycm_password_reset_attempts_window_idx
  ON ycm_password_reset_attempts (window_started_at);

-- Keep the reset-rate table small without requiring a separate cron job.
DELETE FROM ycm_password_reset_attempts
WHERE window_started_at < NOW() - INTERVAL '24 hours';
