-- YCM One: verified government contacts + citizen grievance case layer
CREATE TABLE IF NOT EXISTS ycm_government_contacts (
  contact_id UUID PRIMARY KEY,
  jurisdiction_level TEXT NOT NULL CHECK (jurisdiction_level IN ('india','state','division','district','sub_district','block','gram_panchayat','village','ward')),
  country_code TEXT NOT NULL DEFAULT 'IN',
  state_code TEXT, district_code TEXT, division_code TEXT, sub_district_code TEXT,
  block_code TEXT, gram_panchayat_code TEXT, village_code TEXT, ward_code TEXT,
  department_code TEXT NOT NULL, department_name TEXT NOT NULL, designation TEXT NOT NULL,
  officer_name TEXT, official_phone TEXT, official_email TEXT, official_website TEXT, grievance_url TEXT,
  anti_corruption BOOLEAN NOT NULL DEFAULT FALSE, emergency BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT NOT NULL, source_name TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','expired')),
  verified_at TIMESTAMPTZ, verified_by TEXT, valid_from DATE, valid_until DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_contacts_geo ON ycm_government_contacts(state_code,district_code,block_code,gram_panchayat_code,village_code);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_contacts_department ON ycm_government_contacts(department_code,verification_status);

CREATE TABLE IF NOT EXISTS ycm_government_grievance_cases (
  case_id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES ycm_users(id), family_id UUID,
  title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, department_code TEXT,
  jurisdiction_level TEXT, state_code TEXT, district_code TEXT, block_code TEXT,
  gram_panchayat_code TEXT, village_code TEXT, target_contact_id UUID REFERENCES ycm_government_contacts(contact_id),
  allegation_type TEXT NOT NULL DEFAULT 'service_issue' CHECK (allegation_type IN ('service_issue','delay','refusal','document_issue','misconduct','bribery_report','other')),
  official_channel TEXT, official_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged','in_progress','resolved','rejected','appeal','closed')),
  submitted_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_grievance_user ON ycm_government_grievance_cases(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_grievance_geo ON ycm_government_grievance_cases(state_code,district_code,block_code,gram_panchayat_code,village_code);

CREATE TABLE IF NOT EXISTS ycm_government_grievance_events (
  event_id UUID PRIMARY KEY, case_id UUID NOT NULL REFERENCES ycm_government_grievance_cases(case_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, note TEXT, official_reference TEXT,
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES ycm_users(id)
);
CREATE INDEX IF NOT EXISTS idx_ycm_gov_grievance_events_case ON ycm_government_grievance_events(case_id,event_at DESC);
