-- YCM ONE / Customer + Family 360
-- Run once against the production PostgreSQL database before enabling DB writes.

CREATE TABLE IF NOT EXISTS ycm_families (
  family_id TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  validity_years INTEGER NOT NULL DEFAULT 2 CHECK (validity_years > 0),
  status TEXT NOT NULL CHECK (status IN ('pending_payment','active','expired','suspended')),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_family_members (
  member_id UUID PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  date_of_birth DATE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_family_consents (
  consent_id UUID PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  policy_version TEXT NOT NULL,
  granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_family_documents (
  document_id UUID PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  storage_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ycm_family_cases (
  case_id UUID PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  case_category_id TEXT NOT NULL,
  case_category_name TEXT NOT NULL,
  sub_service TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_family_payments (
  payment_id UUID PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL,
  provider_reference TEXT,
  status TEXT NOT NULL CHECK (status IN ('created','pending','success','failed','refunded')),
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_family_otp_challenges (
  challenge_id UUID PRIMARY KEY,
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  mobile TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created','sent','verified','expired','failed')),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ycm_audit_events (
  event_id UUID PRIMARY KEY,
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ycm_family_members_family ON ycm_family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_ycm_family_consents_family ON ycm_family_consents(family_id);
CREATE INDEX IF NOT EXISTS idx_ycm_family_documents_family ON ycm_family_documents(family_id);
CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_family ON ycm_family_cases(family_id);
CREATE INDEX IF NOT EXISTS idx_ycm_family_cases_category ON ycm_family_cases(case_category_id);
CREATE INDEX IF NOT EXISTS idx_ycm_family_payments_family ON ycm_family_payments(family_id);
CREATE INDEX IF NOT EXISTS idx_ycm_family_otp_mobile ON ycm_family_otp_challenges(mobile);
CREATE INDEX IF NOT EXISTS idx_ycm_audit_family ON ycm_audit_events(family_id);
