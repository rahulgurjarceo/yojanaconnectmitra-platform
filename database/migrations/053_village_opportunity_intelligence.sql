-- YCM ONE: village opportunity intelligence
CREATE TABLE IF NOT EXISTS ycm_village_opportunity_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES ycm_location_units(location_id) ON DELETE CASCADE,
  population INTEGER,
  family_count INTEGER,
  student_count INTEGER,
  government_school_count INTEGER NOT NULL DEFAULT 0,
  nearest_government_school_km NUMERIC(8,2),
  bank_branch_count INTEGER NOT NULL DEFAULT 0,
  atm_count INTEGER NOT NULL DEFAULT 0,
  banking_correspondent_count INTEGER NOT NULL DEFAULT 0,
  insured_population_pct NUMERIC(5,2),
  insurance_service_point_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  source_name TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  observed_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_village_opportunity_location ON ycm_village_opportunity_profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_ycm_village_opportunity_school ON ycm_village_opportunity_profiles(student_count,government_school_count);
CREATE INDEX IF NOT EXISTS idx_ycm_village_opportunity_banking ON ycm_village_opportunity_profiles(bank_branch_count,atm_count,banking_correspondent_count);
