import { randomUUID } from 'node:crypto';
import { buildSignedJanAadhaarPayload, decryptJanAadhaarPayload, encryptSignedJanAadhaarPayload, janAadhaarCertificateFingerprint, verifyJanAadhaarSignature } from './jan-aadhaar-crypto';

function env(name: string): string { const value = process.env[name]; if (!value) throw new Error(name + '_NOT_CONFIGURED'); return value; }
function baseUrl(): string { return (process.env.JAN_AADHAAR_API_BASE_URL || 'https://apitest.sewadwaar.rajasthan.gov.in/app/live/apiservice/janAadhaar/v1').replace(/\/$/, ''); }
function appCode() { return env('JAN_AADHAAR_APP_CODE'); }
function schemeCode() { return env('JAN_AADHAAR_SCHEME_CODE'); }
function transactionId() { return randomUUID(); }

export type JanAadhaarResponse<T = unknown> = { status: number; data: T | null; headers: Headers };
export type JanAadhaarSignedResponse = { response: Record<string, unknown>; signature: string };

async function post(endpoint: string, payload: Record<string, unknown>): Promise<JanAadhaarResponse> {
  const signed = buildSignedJanAadhaarPayload(payload);
  const body = encryptSignedJanAadhaarPayload(signed);
  const response = await fetch(baseUrl() + endpoint + (endpoint.includes('?') ? '&' : '?') + 'client_id=' + encodeURIComponent(env('JAN_AADHAAR_CLIENT_ID')), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Cert-Fingerprint': janAadhaarCertificateFingerprint() },
    body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

export async function memberList(janId: string) {
  return post('/member-list', { appCode: appCode(), schemShortCode: schemeCode(), transactionId: transactionId(), janId });
}
export async function generateOtp(memberId: string) {
  return post('/generate-otp', { appCode: appCode(), schemShortCode: schemeCode(), transactionId: transactionId(), memberId });
}
export async function validateOtp(memberId: string, tid: string, otp: string) {
  return post('/validate-otp', { appCode: appCode(), schemShortCode: schemeCode(), transactionId: transactionId(), memberId, tid, otp });
}
export async function piAuth(janId: string, matchValue: Record<string, unknown>[]) {
  if (!matchValue.length) throw new Error('JAN_AADHAAR_PI_AUTH_MATCH_REQUIRED');
  return post('/janaadhaar-piauth', { appCode: appCode(), schemeCode: schemeCode(), transactionId: transactionId(), janId, matchValue });
}

export function decryptAndVerifyJanAadhaarResponse(encryptedData: string): Record<string, unknown> {
  const plaintext = decryptJanAadhaarPayload(encryptedData);
  const parsed = JSON.parse(plaintext) as JanAadhaarSignedResponse;
  if (!parsed?.response || typeof parsed.signature !== 'string') throw new Error('JAN_AADHAAR_RESPONSE_FORMAT_INVALID');
  if (!verifyJanAadhaarSignature(JSON.stringify({ response: parsed.response }), parsed.signature)) throw new Error('JAN_AADHAAR_RESPONSE_SIGNATURE_INVALID');
  return parsed.response;
}
