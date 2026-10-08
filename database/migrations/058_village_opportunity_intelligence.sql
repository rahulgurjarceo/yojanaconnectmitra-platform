-- 058: Village Opportunity Intelligence
CREATE TABLE IF NOT EXISTS ycm_village_opportunity_profiles (
 profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 location_id UUID,
 village_code VARCHAR(64),
 village_name VARCHAR(240),
 district_code VARCHAR(64),
 block_code VARCHAR(64),
 government_school_count INTEGER NOT NULL DEFAULT 0,
 nearest_government_school_km NUMERIC(8,2),
 student_count INTEGER NOT NULL DEFAULT 0,
 bank_branch_count INTEGER NOT NULL DEFAULT 0,
 atm_count INTEGER NOT NULL DEFAULT 0,
 banking_correspondent_count INTEGER NOT NULL DEFAULT 0,
 insured_population_pct NUMERIC(5,2),
 insurance_service_point_count INTEGER NOT NULL DEFAULT 0,
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_village_opportunity_location ON ycm_village_opportunity_profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_ycm_village_opportunity_geo ON ycm_village_opportunity_profiles(district_code,block_code);
