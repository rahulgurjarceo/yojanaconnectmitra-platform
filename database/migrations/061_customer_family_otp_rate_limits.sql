-- 061: per-mobile customer-family OTP send throttling.
-- Store only an HMAC of the mobile number; never persist the raw number in this table.
CREATE TABLE IF NOT EXISTS ycm_family_otp_rate_limits (
  mobile_hash CHAR(64) PRIMARY KEY CHECK (mobile_hash ~ '^[0-9a-f]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_family_otp_rate_limits_window
  ON ycm_family_otp_rate_limits(window_started_at);
