-- YCM ONE / Individual + Family ₹99 membership foundation
-- Keeps Individual registration separate from Family registration.
-- Payment activation is intentionally pending until a verified payment webhook activates the membership.

CREATE TABLE IF NOT EXISTS ycm_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('individual','family')),
  plan_code TEXT NOT NULL DEFAULT 'YCM_99_2Y',
  amount_paise INTEGER NOT NULL DEFAULT 9900 CHECK (amount_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  validity_years INTEGER NOT NULL DEFAULT 2 CHECK (validity_years > 0),
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','active','expired','suspended','cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ycm_membership_family_scope_check
    CHECK (
      (membership_type = 'family' AND family_id IS NOT NULL)
      OR
      (membership_type = 'individual' AND family_id IS NULL)
      OR
      (status = 'pending_payment' AND family_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_ycm_memberships_user ON ycm_memberships(user_id, status);
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

COMMENT ON TABLE ycm_memberships IS 'Paid YCM access scope. Individual and Family are separate customer scopes; ₹99 is a plan price, not a requirement to create a family.';
COMMENT ON COLUMN ycm_memberships.family_id IS 'Set only when a family-scoped membership has been activated against a real ycm_families record.';
