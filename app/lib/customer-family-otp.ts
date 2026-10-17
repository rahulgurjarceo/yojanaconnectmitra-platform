export type OtpChallenge = {
  challengeId: string;
  mobile: string;
  expiresAt: string;
};

export interface CustomerFamilyOtpProvider {
  sendOtp(mobile: string, purpose: 'family_registration' | 'login'): Promise<OtpChallenge>;
  verifyOtp(challengeId: string, otp: string): Promise<{ verified: boolean }>;
}

const REQUEST_TIMEOUT_MS = 8_000;

function configuredEndpoint(): URL | null {
  const rawUrl = process.env.YCM_OTP_API_URL?.trim();
  const apiKey = process.env.YCM_OTP_API_KEY?.trim();
  if (!rawUrl || !apiKey) return null;

  try {
    const url = new URL(rawUrl);
    // Do not send OTP credentials over cleartext HTTP in production.
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return null;
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

async function callOtpGateway(
  baseUrl: URL,
  apiKey: string,
  operation: 'send' | 'verify',
  payload: Record<string, string>,
): Promise<Record<string, unknown>> {
  const endpoint = new URL(operation, baseUrl.toString().endsWith('/') ? baseUrl : new URL(baseUrl.toString() + '/'));
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Never return gateway response bodies: providers sometimes echo sensitive data.
    throw new Error(response.status === 429 ? 'OTP_PROVIDER_RATE_LIMITED' : 'OTP_PROVIDER_REQUEST_FAILED');
  }

  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('OTP_PROVIDER_INVALID_RESPONSE');
  }
  return result as Record<string, unknown>;
}

/**
 * Provider-neutral HTTPS gateway contract:
 * POST {YCM_OTP_API_URL}/send   { mobile, purpose } -> { challengeId, expiresAt }
 * POST {YCM_OTP_API_URL}/verify { challengeId, otp } -> { verified: boolean }
 * The gateway adapts the selected SMS/OTP vendor. Keep vendor credentials server-side.
 */
export function getCustomerFamilyOtpProvider(): CustomerFamilyOtpProvider | null {
  const baseUrl = configuredEndpoint();
  const apiKey = process.env.YCM_OTP_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;

  return {
    async sendOtp(mobile, purpose) {
      const result = await callOtpGateway(baseUrl, apiKey, 'send', { mobile, purpose });
      const challengeId = typeof result.challengeId === 'string' ? result.challengeId.trim() : '';
      const expiresAt = typeof result.expiresAt === 'string' ? result.expiresAt : '';
      if (!challengeId || challengeId.length > 200 || !Number.isFinite(Date.parse(expiresAt))) {
        throw new Error('OTP_PROVIDER_INVALID_RESPONSE');
      }
      return { challengeId, mobile, expiresAt: new Date(expiresAt).toISOString() };
    },

    async verifyOtp(challengeId, otp) {
      if (!challengeId.trim() || !otp.trim()) throw new Error('OTP_FIELDS_REQUIRED');
      const result = await callOtpGateway(baseUrl, apiKey, 'verify', {
        challengeId: challengeId.trim(),
        otp: otp.trim(),
      });
      if (typeof result.verified !== 'boolean') throw new Error('OTP_PROVIDER_INVALID_RESPONSE');
      return { verified: result.verified };
    },
  };
}
