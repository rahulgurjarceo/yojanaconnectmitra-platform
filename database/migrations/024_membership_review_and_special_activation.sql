-- 024: membership review and controlled special-category activation
-- Standard memberships remain ₹99 / 1 year.
-- Widow household: ₹99 base / 1 year while pending review; after high-management approval -> 2 years.
-- Defense family: no government/defense data integration and no sensitive ID upload is required by this layer;
-- pending review is approved manually by Management/CEO only.

ALTER TABLE ycm_memberships
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (review_status IN ('not_required','pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS review_type TEXT
    CHECK (review_type IN ('widow_household','defense_family')),
  ADD COLUMN IF NOT EXISTS verification_reference TEXT,
  ADD COLUMN IF NOT EXISTS review_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES ycm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Existing special rows created by 023 are normalized to the safe pending state.
UPDATE ycm_memberships
SET review_status='pending',
    review_type=membership_segment,
    validity_years=1,
    plan_code='YCM_99_1Y'
WHERE membership_segment IN ('widow_household','defense_family')
  AND status='pending_payment';

ALTER TABLE ycm_memberships DROP CONSTRAINT IF EXISTS ycm_membership_segment_scope_check;
ALTER TABLE ycm_memberships
  ADD CONSTRAINT ycm_membership_segment_scope_check CHECK (
    (membership_segment='standard' AND validity_years=1 AND review_status='not_required')
    OR
    (membership_segment IN ('widow_household','defense_family')
      AND membership_type='family'
      AND (
        (review_status IN ('pending','rejected') AND validity_years=1)
        OR
        (review_status='approved' AND validity_years=2)
      ))
  );

CREATE INDEX IF NOT EXISTS idx_ycm_memberships_review_queue
  ON ycm_memberships(review_status, membership_segment, updated_at DESC);

COMMENT ON COLUMN ycm_memberships.verification_reference IS
  'Reference to a controlled document/case record. Do not store government/defense source credentials or raw sensitive document contents in this field.';
COMMENT ON COLUMN ycm_memberships.reviewed_by IS
  'Only Management/CEO application roles should perform special-category approval.';
