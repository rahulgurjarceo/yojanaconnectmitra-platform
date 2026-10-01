-- YCM ONE: location directory, community issues and requirement evaluation foundation
CREATE TABLE IF NOT EXISTS ycm_location_units (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_location_id UUID REFERENCES ycm_location_units(location_id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('country','state','district','block','gram_panchayat','village')),
  code TEXT,
  name TEXT NOT NULL,
  state_code TEXT,
  district_code TEXT,
  block_code TEXT,
  gram_panchayat_code TEXT,
  village_code TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  source_name TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_location_parent ON ycm_location_units(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_ycm_location_level_code ON ycm_location_units(level, code);

CREATE TABLE IF NOT EXISTS ycm_local_officials (
  official_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES ycm_location_units(location_id) ON DELETE CASCADE,
  office_type TEXT NOT NULL,
  designation TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  office_address TEXT,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  weekly_off JSONB NOT NULL DEFAULT '[]'::jsonb,
  today_status TEXT NOT NULL DEFAULT 'unknown' CHECK (today_status IN ('open','closed','holiday','restricted','unknown')),
  source_name TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_officials_location ON ycm_local_officials(location_id);

CREATE TABLE IF NOT EXISTS ycm_community_issues (
  issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES ycm_location_units(location_id) ON DELETE SET NULL,
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  affected_family_count INTEGER NOT NULL DEFAULT 0 CHECK (affected_family_count >= 0),
  report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','assigned','submitted','in_progress','resolved','closed')),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  government_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_community_issue_location ON ycm_community_issues(location_id, status);
CREATE INDEX IF NOT EXISTS idx_ycm_community_issue_priority ON ycm_community_issues(priority, status);

CREATE TABLE IF NOT EXISTS ycm_community_issue_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES ycm_community_issues(issue_id) ON DELETE CASCADE,
  family_id TEXT REFERENCES ycm_families(family_id) ON DELETE SET NULL,
  reporter_user_id TEXT,
  note TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_issue_reports_issue ON ycm_community_issue_reports(issue_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ycm_requirement_evaluations (
  evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL REFERENCES ycm_families(family_id) ON DELETE CASCADE,
  member_id UUID REFERENCES ycm_family_members(member_id) ON DELETE SET NULL,
  service_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified','valid','required','action_required','missing','re_kyc','expired','submitted','pending_authority')),
  reason_code TEXT,
  reason TEXT,
  next_action TEXT,
  due_at TIMESTAMPTZ,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_req_eval_family_service ON ycm_requirement_evaluations(family_id, service_code, evaluated_at DESC);
