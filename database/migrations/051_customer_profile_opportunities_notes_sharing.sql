-- YCM ONE: customer opportunity, preparation notes and controlled sharing
CREATE TABLE IF NOT EXISTS ycm_customer_opportunities (
  opportunity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL,
  member_id TEXT,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('job','scheme','scholarship','form','service','other')),
  title TEXT NOT NULL,
  organization TEXT,
  service_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','upcoming','applied','closed','saved')),
  application_start_at TIMESTAMPTZ,
  application_deadline_at TIMESTAMPTZ,
  form_url TEXT,
  eligibility_summary TEXT,
  preparation_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_customer_opportunities_family ON ycm_customer_opportunities(family_id,status,application_deadline_at);

CREATE TABLE IF NOT EXISTS ycm_customer_notes (
  note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL,
  member_id TEXT,
  author_user_id TEXT,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general','job_prep','scheme','form','document','calling')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'employee' CHECK (visibility IN ('employee','customer','manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_customer_notes_family ON ycm_customer_notes(family_id,visibility,created_at DESC);

CREATE TABLE IF NOT EXISTS ycm_customer_shares (
  share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL,
  member_id TEXT,
  created_by_user_id TEXT,
  share_type TEXT NOT NULL CHECK (share_type IN ('form','opportunity','note','compliance')),
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  target TEXT NOT NULL DEFAULT 'customer' CHECK (target IN ('customer','employee','manager')),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_customer_shares_family ON ycm_customer_shares(family_id,revoked_at,expires_at);
