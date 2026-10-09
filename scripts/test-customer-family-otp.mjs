import fs from 'node:fs';

const provider = fs.readFileSync('app/lib/customer-family-otp.ts', 'utf8');
const readiness = fs.readFileSync('app/api/ready/route.ts', 'utf8');

for (const token of [
  'YCM_OTP_API_URL',
  'YCM_OTP_API_KEY',
  "callOtpGateway(baseUrl, apiKey, 'send'",
  "callOtpGateway(baseUrl, apiKey, 'verify'",
  "Authorization: `Bearer ${apiKey}`",
  "AbortSignal.timeout(REQUEST_TIMEOUT_MS)",
  "OTP_PROVIDER_INVALID_RESPONSE",
  "process.env.NODE_ENV === 'production' && url.protocol !== 'https:'",
  'Never return gateway response bodies',
]) {
  if (!provider.includes(token)) throw new Error('OTP provider safety contract missing: ' + token);
}
if (!readiness.includes('getCustomerFamilyOtpProvider()')) {
  throw new Error('Readiness must continue to require a configured OTP provider');
}
console.log('Customer family OTP gateway contract: PASS');
