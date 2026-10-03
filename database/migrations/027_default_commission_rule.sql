-- 027: default unified commercial rule and operational financial APIs
INSERT INTO ycm_commission_rules(service_code,transaction_type,ycm_percent,agent_percent,referral_percent,referral_funded_by,status)
SELECT NULL,'service',60,40,0,'agent','active'
WHERE NOT EXISTS (
 SELECT 1 FROM ycm_commission_rules WHERE service_code IS NULL AND transaction_type='service' AND status='active'
);

CREATE INDEX IF NOT EXISTS idx_ycm_financial_tx_external ON ycm_financial_transactions(external_reference);
CREATE INDEX IF NOT EXISTS idx_ycm_settlements_user_status ON ycm_settlements(user_id,status,requested_at DESC);

COMMENT ON TABLE ycm_commission_rules IS 'Configurable commercial rules. Default service split is 60% YCM / 40% agent; individual services can override it. Referral share is carved from its configured funding source.';
