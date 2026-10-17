import fs from 'node:fs';

const route = fs.readFileSync('app/api/integrations/health/route.ts', 'utf8');
const registry = fs.readFileSync('app/lib/ycm-integration-registry.ts', 'utf8');
const otpProvider = fs.readFileSync('app/lib/customer-family-otp.ts', 'utf8');

for (const token of [
  'AUTHENTICATION_REQUIRED',
  'FORBIDDEN_ROLE_SCOPE',
  'getYcmIntegrationStatus',
  'configured',
  'byTier',
  'credentials and secret values',
]) {
  if (!route.includes(token)) throw new Error('Missing integration readiness contract: ' + token);
}

for (const token of ['YCM_OCR', 'YCM_WHATSAPP', 'YCM_SMS', 'YCM_PAYMENTS', 'YCM_AEPS']) {
  if (!registry.includes(token)) throw new Error('Missing integration registry contract: ' + token);
}

for (const token of ['YCM_OTP_API_URL', 'YCM_OTP_API_KEY', "'send'", "'verify'", 'AbortSignal.timeout', 'OTP_PROVIDER_INVALID_RESPONSE']) {
  if (!otpProvider.includes(token)) throw new Error('Missing safe OTP gateway contract: ' + token);
}
if (route.includes('process.env.YCM_')) {
  throw new Error('Integration readiness route must not expose provider secret values.');
}

console.log('Integration readiness contract: PASS');
