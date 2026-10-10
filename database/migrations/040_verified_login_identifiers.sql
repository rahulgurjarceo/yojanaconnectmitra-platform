-- 040: portable verified identity login identifiers (ration card, passport and future identity providers)
CREATE TABLE IF NOT EXISTS ycm_login_identifiers (
  identifier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  identifier_type VARCHAR(32) NOT NULL CHECK (identifier_type IN ('aadhaar','jan_aadhaar','pan','voter_id','ration_card','passport','driving_license')),
  identifier_hash CHAR(64) NOT NULL,
  masked_value VARCHAR(80),
  verification_status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','revoked','expired')),
  verification_source VARCHAR(120),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier_type, identifier_hash)
);
CREATE INDEX IF NOT EXISTS idx_ycm_login_identifiers_user ON ycm_login_identifiers(user_id, identifier_type, verification_status);
CREATE INDEX IF NOT EXISTS idx_ycm_login_identifiers_lookup ON ycm_login_identifiers(identifier_type, identifier_hash, verification_status);
COMMENT ON TABLE ycm_login_identifiers IS 'Verified alternate login identifiers. Raw identity numbers must never be stored; only SHA-256 hashes and masked display values are retained.';

ALTER TABLE ycm_login_identifiers
  ADD COLUMN IF NOT EXISTS hash_algorithm TEXT NOT NULL DEFAULT 'sha256';

ALTER TABLE ycm_login_identifiers
  ADD CONSTRAINT ycm_login_identifiers_hash_algorithm_chk
  CHECK (hash_algorithm IN ('sha256','hmac_sha256'));

CREATE INDEX IF NOT EXISTS idx_ycm_login_identifiers_hash_algorithm
  ON ycm_login_identifiers(hash_algorithm);
