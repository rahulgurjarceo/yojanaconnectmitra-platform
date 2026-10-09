import fs from 'node:fs';

const provider = fs.readFileSync('app/lib/customer-family-otp.ts', 'utf8');
const readiness = fs.readFileSync('app/api/ready/route.ts', 'utf8');
const repository = fs.readFileSync('app/lib/customer-family-postgres.ts', 'utf8');
const repositoryTypes = fs.readFileSync('app/lib/customer-family-db.ts', 'utf8');
const otpRoute = fs.readFileSync('app/api/customer-family/otp/route.ts', 'utf8');
const rateLimitMigration = fs.readFileSync('database/migrations/061_customer_family_otp_rate_limits.sql', 'utf8');
const verifyRoute = fs.readFileSync('app/api/customer-family/otp/verify/route.ts', 'utf8');
const verificationMigration = fs.readFileSync('database/migrations/062_customer_family_otp_verification_attempts.sql', 'utf8');

for (const token of [
  'YCM_OTP_API_URL',
  'YCM_OTP_API_KEY',
  "callOtpGateway(baseUrl, apiKey, 'send'",
  "callOtpGateway(baseUrl, apiKey, 'verify'",
  "Authorization: `Bearer ${apiKey}`",
  'AbortSignal.timeout(REQUEST_TIMEOUT_MS)',
  'OTP_PROVIDER_INVALID_RESPONSE',
  "process.env.NODE_ENV === 'production' && url.protocol !== 'https:'",
  'Never return gateway response bodies',
]) {
  if (!provider.includes(token)) throw new Error('OTP provider safety contract missing: ' + token);
}
for (const token of ['otp_rate_limit_schema', 'otp_verification_attempt_schema', 'ycm_family_otp_rate_limits', 'verification_attempts']) {
  if (!readiness.includes(token)) throw new Error('Readiness must check OTP security schema: ' + token);
}
if (!readiness.includes('getCustomerFamilyOtpProvider()')) {
  throw new Error('Readiness must continue to require a configured OTP provider');
}
for (const [name, source, tokens] of [
  ['OTP rate limit migration', rateLimitMigration, ['ycm_family_otp_rate_limits', 'mobile_hash', 'request_count', 'last_requested_at']],
  ['OTP repository', repository, ['reserveOtpSend(mobile: string)', 'createHmac', "INTERVAL '1 hour'", "INTERVAL '60 seconds'", 'current_limit.request_count < 5', 'OTP_RATE_LIMIT_SECRET_NOT_CONFIGURED']],
  ['OTP repository interface', repositoryTypes, ['reserveOtpSend(mobile: string): Promise<boolean>', 'reserveOtpVerification(challengeId: string): Promise<boolean>']],
  ['OTP send route', otpRoute, ['repository.reserveOtpSend(mobile)', 'OTP_RATE_LIMITED', "'Retry-After': '60'", 'OTP_RATE_LIMIT_CHECK_FAILED']],
  ['OTP verification migration', verificationMigration, ['verification_attempts INTEGER NOT NULL DEFAULT 0', 'CHECK (verification_attempts >= 0)']],
  ['OTP verification repository', repository, ['reserveOtpVerification(challengeId: string)', 'verification_attempts < 5']],
  ['OTP verification route', verifyRoute, ['repository.reserveOtpVerification(body.challengeId)', 'OTP_ATTEMPTS_EXCEEDED', 'Validate the challenge\'s family binding before spending a provider verification attempt']],
]) {
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(name + ': missing ' + token);
  }
}
console.log('Customer family OTP gateway and rate-limit contract: PASS');
