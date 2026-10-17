-- YCM ONE / Individual + Family ₹99 membership foundation
-- Keeps Individual registration separate from Family registration.
-- Payment activation is intentionally pending until a verified payment webhook activates the membership.

CREATE TABLE IF NOT EXISTS ycm_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('individual','family')),
  membership_segment TEXT NOT NULL DEFAULT 'standard'
    CHECK (membership_segment IN ('standard','defense_family','widow_household')),
  plan_code TEXT NOT NULL DEFAULT 'YCM_99_1Y',
  amount_paise INTEGER NOT NULL DEFAULT 9900 CHECK (amount_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  validity_years INTEGER NOT NULL DEFAULT 1 CHECK (validity_years IN (1,2)),
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','active','expired','suspended','cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_membership_family_scope_check
    CHECK (
      (membership_type = 'family' AND (family_id IS NOT NULL OR status = 'pending_payment'))
      OR
      (membership_type = 'individual' AND family_id IS NULL)
    )
    ,CONSTRAINT ycm_membership_segment_scope_check
    CHECK (
      (membership_segment = 'standard' AND validity_years = 1)
      OR
      (membership_segment IN ('defense_family','widow_household') AND membership_type = 'family' AND validity_years = 2)
    )
);

CREATE INDEX IF NOT EXISTS idx_ycm_memberships_user ON ycm_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ycm_memberships_segment ON ycm_memberships(membership_segment, status);
CREATE INDEX IF NOT EXISTS idx_ycm_memberships_family ON ycm_memberships(family_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS ycm_memberships_one_pending_per_user_type
  ON ycm_memberships(user_id, membership_type) WHERE status = 'pending_payment';

CREATE UNIQUE INDEX IF NOT EXISTS ycm_memberships_one_active_per_user_type
  ON ycm_memberships(user_id, membership_type) WHERE status = 'active';

CREATE OR REPLACE FUNCTION ycm_touch_memberships_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ycm_memberships_updated_at ON ycm_memberships;
CREATE TRIGGER ycm_memberships_updated_at
BEFORE UPDATE ON ycm_memberships FOR EACH ROW EXECUTE FUNCTION ycm_touch_memberships_updated_at();

COMMENT ON TABLE ycm_memberships IS 'Paid YCM access scope. Standard Individual/Household membership is ₹99 for 1 year. Verified Defense Family and Widow Household memberships are ₹99 for 2 years.';
COMMENT ON COLUMN ycm_memberships.family_id IS 'Set only when a family-scoped membership has been activated against a real ycm_families record.';

-- Normalize the default plan for this membership model when upgrading an existing 023 schema.
ALTER TABLE ycm_memberships ALTER COLUMN plan_code SET DEFAULT 'YCM_99_1Y';
ALTER TABLE ycm_memberships ALTER COLUMN validity_years SET DEFAULT 1;
