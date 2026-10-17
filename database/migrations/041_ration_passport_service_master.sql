-- 041: expand the unified service master for ration card and identity-linked passport workflows
INSERT INTO ycm_service_master
(service_code,service_name,service_type,business_domain_code,channel,requires_documents,requires_provider,metadata)
VALUES
('DOC_RATION_CARD','Ration Card / PDS Assistance','government','government-services-schemes','assisted',true,false,'{"services":["new_card","correction","member_addition","member_deletion","transfer","eKYC","status","ONORC"],"identity_login_supported":true}'),
('DOC_RATION_CARD_EKYC','Ration Card eKYC & ONORC Assistance','government','government-services-schemes','assisted',true,false,'{"identity":["aadhaar","ration_card"],"onorc":true}'),
('AUTH_RATION_CARD_LOGIN','Verified Ration Card Linked Login','other','documents-certificates','api',false,false,'{"identifier_type":"ration_card","requires_authoritative_verification":true,"password_or_otp_required":true}'),
('AUTH_PASSPORT_LOGIN','Verified Passport Linked Login','other','travel-passport-visa-immigration','api',false,false,'{"identifier_type":"passport","requires_authoritative_verification":true,"password_or_otp_required":true}'),
('TRAVEL_PASSPORT','Passport Assistance','travel','travel-passport-visa-immigration','assisted',true,false,'{"workflow":"application_appointment_status","identity_login_supported":true}')
ON CONFLICT (service_code) DO UPDATE SET service_name=EXCLUDED.service_name,metadata=EXCLUDED.metadata,updated_at=now();