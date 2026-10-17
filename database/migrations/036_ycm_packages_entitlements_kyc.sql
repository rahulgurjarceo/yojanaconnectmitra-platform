-- 032: YCM One commercial packages, entitlements and verification state
CREATE TABLE IF NOT EXISTS ycm_product_packages (
  package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code VARCHAR(64) NOT NULL UNIQUE,
  package_name VARCHAR(160) NOT NULL,
  package_type VARCHAR(32) NOT NULL CHECK (package_type IN ('all_in_one','fintech_api','custom')),
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  validity_days INTEGER NOT NULL DEFAULT 365 CHECK (validity_days > 0),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ycm_package_entitlements (
  entitlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES ycm_product_packages(package_id) ON DELETE CASCADE,
  entitlement_code VARCHAR(120) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(package_id,entitlement_code)
);
CREATE TABLE IF NOT EXISTS ycm_user_packages (
  user_package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES ycm_product_packages(package_id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','active','expired','suspended','cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_reference VARCHAR(180),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_user_packages_user ON ycm_user_packages(user_id,status,expires_at DESC);
CREATE TABLE IF NOT EXISTS ycm_identity_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ycm_users(id) ON DELETE CASCADE,
  verification_type VARCHAR(32) NOT NULL CHECK (verification_type IN ('pan','aadhaar','bank','mobile_otp','merchant_ekyc','face')),
  provider VARCHAR(64),
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','otp_sent','verified','failed','expired','manual_review')),
  provider_reference VARCHAR(180),
  masked_value VARCHAR(180),
  verified_name VARCHAR(180),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ycm_identity_verifications_user ON ycm_identity_verifications(user_id,verification_type,status,created_at DESC);
INSERT INTO ycm_product_packages(package_code,package_name,package_type,price_paise,validity_days,metadata)
VALUES
 ('YCM_ONE_START','YCM One Start','all_in_one',299900,365,'{"marketing_price":2999}'),
 ('YCM_ONE_PRO','YCM One Pro','all_in_one',399900,365,'{"marketing_price":3999}'),
 ('YCM_ONE_BUSINESS','YCM One Business','all_in_one',499900,365,'{"marketing_price":4999}'),
 ('YCM_ONE_ENTERPRISE','YCM One Enterprise','all_in_one',1000000,365,'{"marketing_price":10000}'),
 ('YCM_FINTECH_ID','YCM Fintech/API ID','fintech_api',9900,365,'{"marketing_price":99}')
ON CONFLICT(package_code) DO NOTHING;
INSERT INTO ycm_package_entitlements(package_id,entitlement_code)
SELECT p.package_id,e.code FROM ycm_product_packages p CROSS JOIN (VALUES
 ('SERVICE_CATALOG'),('GOVERNMENT_ASSISTANCE'),('DOCUMENT_SERVICES'),('SCHEME_ASSISTANCE'),
 ('CRM_LEADS'),('FAMILY_360'),('PARTNER_WALLET'),('COMMISSION_LEDGER'),('PAYOUT_DESTINATIONS'),
 ('PAN_VERIFICATION'),('BANK_ACCOUNT_VERIFICATION'),('MOBILE_OTP'),('AEPS_ONBOARDING'),
 ('AEPS_EKYC'),('AEPS_DAILY_AUTH'),('AEPS_TRANSACTION'),('PAYMENT_GATEWAY')
) e(code)
WHERE p.package_type='all_in_one'
ON CONFLICT(package_id,entitlement_code) DO NOTHING;
INSERT INTO ycm_package_entitlements(package_id,entitlement_code)
SELECT p.package_id,e.code FROM ycm_product_packages p CROSS JOIN (VALUES
 ('PAN_VERIFICATION'),('BANK_ACCOUNT_VERIFICATION'),('MOBILE_OTP'),('AEPS_ONBOARDING'),
 ('AEPS_EKYC'),('AEPS_DAILY_AUTH'),('AEPS_TRANSACTION'),('PAYMENT_GATEWAY'),
 ('COMMISSION_LEDGER'),('PAYOUT_DESTINATIONS')
) e(code)
WHERE p.package_code='YCM_FINTECH_ID'
ON CONFLICT(package_id,entitlement_code) DO NOTHING;
COMMENT ON TABLE ycm_product_packages IS 'Commercial catalog. Marketing may change price/slab; service entitlements remain explicit.';
COMMENT ON TABLE ycm_identity_verifications IS 'Verification state only; raw Aadhaar/bank secrets should not be stored here.';
