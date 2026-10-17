-- 062: cap OTP verification attempts per challenge to limit brute-force guessing.
ALTER TABLE ycm_family_otp_challenges
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0
  CHECK (verification_attempts >= 0);
