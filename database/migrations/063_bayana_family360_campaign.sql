-- 063: Bayana Family 360 hybrid campaign. Never store Aadhaar numbers or document images here.
CREATE TABLE IF NOT EXISTS ycm_campaigns (
 campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_code TEXT NOT NULL UNIQUE,
 campaign_name TEXT NOT NULL, state_code TEXT NOT NULL DEFAULT 'RJ', district_name TEXT NOT NULL DEFAULT 'Bharatpur',
 block_name TEXT NOT NULL DEFAULT 'Bayana', target_households INTEGER NOT NULL DEFAULT 72000 CHECK(target_households>0),
 target_registrations INTEGER NOT NULL DEFAULT 50000 CHECK(target_registrations>=0),
 starts_on DATE, ends_on DATE, status TEXT NOT NULL DEFAULT 'planning' CHECK(status IN('planning','pilot','active','paused','completed','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ycm_campaign_villages (
 village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID NOT NULL REFERENCES ycm_campaigns(campaign_id) ON DELETE CASCADE,
 village_code TEXT NOT NULL, village_name TEXT NOT NULL, gram_panchayat TEXT, zone_name TEXT,
 estimated_households INTEGER NOT NULL DEFAULT 0 CHECK(estimated_households>=0),
 status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN('not_started','planned','in_progress','completed','on_hold')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(campaign_id,village_code)
);
CREATE TABLE IF NOT EXISTS ycm_campaign_teams (
 team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID NOT NULL REFERENCES ycm_campaigns(campaign_id) ON DELETE CASCADE,
 team_code TEXT NOT NULL, team_name TEXT NOT NULL, zone_name TEXT, team_lead_user_id UUID,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','paused','closed')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(campaign_id,team_code)
);
CREATE TABLE IF NOT EXISTS ycm_campaign_team_members (
 team_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID NOT NULL REFERENCES ycm_campaign_teams(team_id) ON DELETE CASCADE,
 employee_user_id UUID NOT NULL, member_role TEXT NOT NULL CHECK(member_role IN('team_leader','registration','documents','field','sales')),
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(team_id,employee_user_id)
);
CREATE TABLE IF NOT EXISTS ycm_campaign_camps (
 camp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID NOT NULL REFERENCES ycm_campaigns(campaign_id) ON DELETE CASCADE,
 village_id UUID REFERENCES ycm_campaign_villages(village_id) ON DELETE SET NULL, team_id UUID REFERENCES ycm_campaign_teams(team_id) ON DELETE SET NULL,
 camp_name TEXT NOT NULL, venue TEXT, scheduled_at TIMESTAMPTZ NOT NULL,
 status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN('planned','live','completed','cancelled')), created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ycm_campaign_households (
 household_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID NOT NULL REFERENCES ycm_campaigns(campaign_id) ON DELETE CASCADE,
 village_id UUID REFERENCES ycm_campaign_villages(village_id) ON DELETE SET NULL, household_ref TEXT NOT NULL,
 head_name TEXT NOT NULL, contact_mobile TEXT, family_size INTEGER NOT NULL DEFAULT 1 CHECK(family_size BETWEEN 1 AND 30),
 contact_consent BOOLEAN NOT NULL DEFAULT FALSE,
 family360_status TEXT NOT NULL DEFAULT 'not_registered' CHECK(family360_status IN('not_registered','interested','registered','follow_up','not_interested')),
 source TEXT NOT NULL CHECK(source IN('doorstep','camp','referral','online')), created_by UUID,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(campaign_id,household_ref)
);
CREATE TABLE IF NOT EXISTS ycm_campaign_visits (
 visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID NOT NULL REFERENCES ycm_campaigns(campaign_id) ON DELETE CASCADE,
 household_id UUID NOT NULL REFERENCES ycm_campaign_households(household_id) ON DELETE CASCADE,
 team_id UUID REFERENCES ycm_campaign_teams(team_id) ON DELETE SET NULL, camp_id UUID REFERENCES ycm_campaign_camps(camp_id) ON DELETE SET NULL,
 visit_type TEXT NOT NULL CHECK(visit_type IN('doorstep','camp')),
 outcome TEXT NOT NULL CHECK(outcome IN('contacted','registered','interested','follow_up','not_available','not_interested')),
 service_interest TEXT, notes TEXT, visited_by UUID, visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_campaign_households_village_idx ON ycm_campaign_households(campaign_id,village_id);
CREATE INDEX IF NOT EXISTS ycm_campaign_households_status_idx ON ycm_campaign_households(campaign_id,family360_status);
CREATE INDEX IF NOT EXISTS ycm_campaign_visits_date_idx ON ycm_campaign_visits(campaign_id,visited_at DESC);
INSERT INTO ycm_campaigns(campaign_code,campaign_name,target_households,target_registrations,status)
VALUES('BAYANA-F360-2026','YCM Bayana Family 360 Hybrid Campaign',72000,50000,'pilot') ON CONFLICT(campaign_code) DO NOTHING;
