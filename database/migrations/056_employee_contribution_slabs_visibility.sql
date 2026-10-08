-- 056: manager-only employee performance + configurable contribution slabs
CREATE TABLE IF NOT EXISTS ycm_employee_contribution_slabs (
  slab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slab_code VARCHAR(40) UNIQUE NOT NULL,
  min_score NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (min_score >= 0),
  max_score NUMERIC(6,2),
  contribution_percent NUMERIC(7,2) NOT NULL DEFAULT 0 CHECK (contribution_percent >= 0 AND contribution_percent <= 100),
  reward_multiplier NUMERIC(8,3) NOT NULL DEFAULT 1 CHECK (reward_multiplier >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (max_score IS NULL OR max_score >= min_score)
);
CREATE INDEX IF NOT EXISTS idx_ycm_employee_contribution_slabs_active ON ycm_employee_contribution_slabs(active,sort_order);

-- Default policy is deliberately conservative; management can change these slabs without code changes.
INSERT INTO ycm_employee_contribution_slabs(slab_code,min_score,max_score,contribution_percent,reward_multiplier,sort_order,notes) VALUES
('developing',0,59.99,0,1,10,'Below contribution threshold'),
('standard',60,74.99,5,1,20,'Standard contribution band'),
('strong',75,89.99,8,1.1,30,'Strong contribution band'),
('high',90,99.99,10,1.25,40,'High contribution band'),
('exceptional',100,NULL,15,1.5,50,'Exceptional contribution band')
ON CONFLICT(slab_code) DO NOTHING;