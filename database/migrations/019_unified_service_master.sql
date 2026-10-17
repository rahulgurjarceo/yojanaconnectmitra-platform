-- 019: Unified YCM service master across government, documents and travel
CREATE TABLE IF NOT EXISTS ycm_service_master (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(120) NOT NULL UNIQUE,
  service_name VARCHAR(240) NOT NULL,
  service_type VARCHAR(32) NOT NULL CHECK (service_type IN ('government','document','travel','hotel','flight','business','financial','education','professional','other')),
  business_domain_code VARCHAR(120) REFERENCES ycm_business_domains(domain_code),
  parent_service_code VARCHAR(120) REFERENCES ycm_service_master(service_code),
  channel VARCHAR(32) NOT NULL DEFAULT 'assisted' CHECK (channel IN ('online','assisted','field','referral','api','provider')),
  requires_case BOOLEAN NOT NULL DEFAULT TRUE,
  requires_documents BOOLEAN NOT NULL DEFAULT FALSE,
  requires_provider BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ycm_service_master_domain ON ycm_service_master(business_domain_code);
CREATE INDEX IF NOT EXISTS idx_ycm_service_master_type ON ycm_service_master(service_type);
CREATE INDEX IF NOT EXISTS idx_ycm_service_master_parent ON ycm_service_master(parent_service_code);

INSERT INTO ycm_service_master
(service_code,service_name,service_type,business_domain_code,channel,requires_documents,requires_provider,metadata)
VALUES
('GOV_E_GOVERNMENT_ASSISTANCE','e-Government Services Assistance','government','government-services-schemes','assisted',true,false,'{"scope":"central_state_local","unified":true}'),
('GOV_SCHEME_APPLICATION','Government Scheme Application Assistance','government','government-services-schemes','assisted',true,false,'{"workflow":"eligibility_documents_application_status"}'),
('DOC_IDENTITY','Identity Document Assistance','document','documents-certificates','assisted',true,false,'{"examples":["Aadhaar","PAN","Voter ID"]}'),
('DOC_CERTIFICATE','Certificate Application & Correction','document','documents-certificates','assisted',true,false,'{"examples":["birth","death","caste","income","domicile"]}'),
('DOC_OCR_VERIFICATION','Document OCR & Verification','document','documents-certificates','api',true,false,'{"ocr":true,"mismatch_blocking":true}'),
('DOC_PRINT_DIGITAL_COPY','Document Print / Digital Copy Assistance','document','documents-certificates','assisted',true,false,'{"delivery":["print","digital"]}'),
('TRAVEL_PASSPORT','Passport Assistance','travel','travel-passport-visa-immigration','assisted',true,false,'{"workflow":"application_appointment_status"}'),
('TRAVEL_VISA','Visa / Immigration Assistance','travel','travel-passport-visa-immigration','assisted',true,true,'{"provider_routing":true}'),
('TRAVEL_FLIGHT','Flight Search & Booking Assistance','flight','travel-passport-visa-immigration','provider',false,true,'{"booking_api_ready":true,"booking_provider_required":true}'),
('TRAVEL_HOTEL','Hotel Search & Booking Assistance','hotel','travel-passport-visa-immigration','provider',false,true,'{"booking_api_ready":true,"booking_provider_required":true}'),
('TRAVEL_PACKAGE','Travel Package / Itinerary Assistance','travel','travel-passport-visa-immigration','assisted',false,true,'{"flight_hotel_transfer":true}'),
('TRAVEL_FOREX_INSURANCE','Travel Insurance / Forex Assistance','financial','loans-finance-insurance','referral',true,true,'{"regulated_provider_routing":true}')
ON CONFLICT (service_code) DO UPDATE SET
 service_name=EXCLUDED.service_name,
 service_type=EXCLUDED.service_type,
 business_domain_code=EXCLUDED.business_domain_code,
 channel=EXCLUDED.channel,
 requires_documents=EXCLUDED.requires_documents,
 requires_provider=EXCLUDED.requires_provider,
 metadata=EXCLUDED.metadata,
 updated_at=now();

COMMENT ON TABLE ycm_service_master IS 'Unified service catalog. Government, documents, flight and hotel are service types inside the same YCM One case lifecycle, not separate apps.';
