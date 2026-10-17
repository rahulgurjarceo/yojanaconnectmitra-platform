-- 028: canonical AEPS financial service for the unified transaction ledger
INSERT INTO ycm_service_master
(service_code,service_name,service_type,business_domain_code,channel,requires_case,requires_documents,requires_provider,metadata)
VALUES
('FIN_AEPS','AEPS Financial Transaction','financial','banking-financial-services','provider',false,false,true,'{"ledger":true,"commissionable":true,"provider_webhook":true}')
ON CONFLICT (service_code) DO UPDATE SET
 service_name=EXCLUDED.service_name,
 service_type=EXCLUDED.service_type,
 business_domain_code=EXCLUDED.business_domain_code,
 channel=EXCLUDED.channel,
 requires_provider=EXCLUDED.requires_provider,
 metadata=EXCLUDED.metadata,
 updated_at=NOW();

COMMENT ON COLUMN ycm_financial_transactions.service_code IS 'Canonical YCM service code. AEPS uses FIN_AEPS; paid services use their service-master code.';


INSERT INTO ycm_commission_rules
(service_code,transaction_type,ycm_percent,agent_percent,referral_percent,referral_funded_by,status)
SELECT 'FIN_AEPS','aeps',60,40,0,'agent','active'
WHERE NOT EXISTS (
 SELECT 1 FROM ycm_commission_rules
 WHERE service_code='FIN_AEPS' AND transaction_type='aeps' AND status='active'
);
