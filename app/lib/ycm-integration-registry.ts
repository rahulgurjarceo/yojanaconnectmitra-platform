export type IntegrationTier = 'P0' | 'P1' | 'P2' | 'P3';

export const YCM_INTEGRATION_REGISTRY = [
  { code: 'ocr', tier: 'P0', name: 'OCR / Document AI', env: 'YCM_OCR' },
  { code: 'digilocker', tier: 'P0', name: 'DigiLocker / API Setu', env: 'YCM_DIGILOCKER' },
  { code: 'jan-aadhaar', tier: 'P0', name: 'Rajasthan Jan Aadhaar', env: 'YCM_JANAADHAAR' },
  { code: 'lgd', tier: 'P0', name: 'Local Government Directory', env: 'YCM_LGD' },
  { code: 'maps', tier: 'P0', name: 'Maps / Geocoding', env: 'YCM_MAPS' },
  { code: 'whatsapp', tier: 'P0', name: 'WhatsApp Business', env: 'YCM_WHATSAPP' },
  { code: 'sms', tier: 'P0', name: 'SMS / OTP', env: 'YCM_SMS' },
  { code: 'payments', tier: 'P0', name: 'Payment Gateway', env: 'YCM_PAYMENTS' },
  { code: 'pan', tier: 'P1', name: 'PAN Verification', env: 'YCM_PAN' },
  { code: 'gst', tier: 'P1', name: 'GST Verification', env: 'YCM_GST' },
  { code: 'udyam', tier: 'P1', name: 'Udyam Verification', env: 'YCM_UDYAM' },
  { code: 'bank', tier: 'P1', name: 'Bank Account Verification', env: 'YCM_BANK' },
  { code: 'voter', tier: 'P1', name: 'Voter Verification', env: 'YCM_VOTER' },
  { code: 'dl', tier: 'P1', name: 'Driving Licence Verification', env: 'YCM_DL' },
  { code: 'passport', tier: 'P1', name: 'Passport Verification', env: 'YCM_PASSPORT' },
  { code: 'education', tier: 'P1', name: 'Education Verification', env: 'YCM_EDUCATION' },
  { code: 'state-services', tier: 'P1', name: 'State / e-District Services', env: 'YCM_STATE_SERVICES' },
  { code: 'grievance', tier: 'P2', name: 'Government Grievance', env: 'YCM_GRIEVANCE' },
  { code: 'rnfi', tier: 'P2', name: 'AEPS / DMT / BBPS', env: 'YCM_RNFI' },
  { code: 'insurance', tier: 'P2', name: 'Insurance', env: 'YCM_INSURANCE' },
  { code: 'loans', tier: 'P2', name: 'Loans / Finance', env: 'YCM_LOANS' },
  { code: 'jobs', tier: 'P2', name: 'Jobs', env: 'YCM_JOBS' },
  { code: 'admissions', tier: 'P2', name: 'Education / Admissions', env: 'YCM_ADMISSIONS' },
  { code: 'travel', tier: 'P3', name: 'Travel / Immigration', env: 'YCM_TRAVEL' },
  { code: 'business', tier: 'P3', name: 'Business / Compliance', env: 'YCM_BUSINESS' },
  { code: 'other', tier: 'P3', name: 'Other Service Adapters', env: 'YCM_OTHER_SERVICES' },
] as const;

export function getYcmIntegrationStatus() {
  return YCM_INTEGRATION_REGISTRY.map((item) => ({
    ...item,
    configured: Boolean(process.env[item.env]),
  }));
}
