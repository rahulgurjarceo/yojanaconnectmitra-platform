-- 030: settlement destination binding
ALTER TABLE ycm_settlements
  ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES ycm_payout_destinations(destination_id);

CREATE INDEX IF NOT EXISTS idx_ycm_settlements_destination
  ON ycm_settlements(destination_id,status,requested_at DESC);
