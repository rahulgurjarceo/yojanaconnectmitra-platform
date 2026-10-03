import { buildSignedJanAadhaarPayload, encryptSignedJanAadhaarPayload, janAadhaarCertificateFingerprint } from './jan-aadhaar-crypto';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(name + '_NOT_CONFIGURED');
  return value;
}

export type JanAadhaarRequest = { endpoint: string; payload: Record<string, unknown> };
export type JanAadhaarResponse = { status: number; data: unknown; headers: Headers };

export async function callJanAadhaar(request: JanAadhaarRequest): Promise<JanAadhaarResponse> {
  const baseUrl = env('JAN_AADHAAR_API_BASE_URL').replace(/\\/$/, '');
  if (!request.endpoint.startsWith('/')) throw new Error('JAN_AADHAAR_ENDPOINT_INVALID');
  const signed = buildSignedJanAadhaarPayload(request.payload);
  const body = encryptSignedJanAadhaarPayload(signed);
  const response = await fetch(baseUrl + request.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Cert-Fingerprint': janAadhaarCertificateFingerprint(),
      'X-App-Code': env('JAN_AADHAAR_APP_CODE'),
      'X-Scheme-Code': env('JAN_AADHAAR_SCHEME_CODE'),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}
