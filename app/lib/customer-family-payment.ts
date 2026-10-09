import { createHmac, timingSafeEqual } from 'node:crypto';
import { enabledPaymentProviders, paymentEnvironment } from './payment/unified-payment';

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const PROVIDER_TIMEOUT_MS = 10_000;

export type PaymentOrder = {
  orderId: string;
  amount: number;
  currency: 'INR';
  status: 'created';
};

export interface CustomerFamilyPaymentProvider {
  createOrder(input: { familyId: string; amount: number; currency: 'INR' }): Promise<PaymentOrder>;
  verifyPayment(input: { orderId: string; paymentId: string; signature: string; amountPaise: number }): Promise<{ verified: boolean }>;
}

/** Verify the standard Razorpay Checkout order_id|payment_id HMAC without a timing leak. */
export function verifyRazorpayCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!input.orderId || !input.paymentId || !/^[a-f0-9]{64}$/i.test(input.signature)) return false;
  const expected = createHmac('sha256', input.secret).update(input.orderId + '|' + input.paymentId).digest();
  const provided = Buffer.from(input.signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function configuredCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret || !enabledPaymentProviders().includes('razorpay')) return null;
  // Do not permit live credentials from a development/test process.
  if (paymentEnvironment() === 'live' && process.env.NODE_ENV !== 'production') return null;
  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
}

async function providerJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok) {
    throw new Error(response.status === 429 ? 'PAYMENT_PROVIDER_RATE_LIMITED' : 'PAYMENT_PROVIDER_REQUEST_FAILED');
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('PAYMENT_PROVIDER_INVALID_RESPONSE');
  }
  return payload as Record<string, unknown>;
}

/**
 * Razorpay adapter for Family 360's fixed ₹99 registration plan.
 * Credentials stay server-side. A payment is accepted only after the signature
 * is valid and Razorpay's payment API reports the matching amount/order as captured.
 */
export function getCustomerFamilyPaymentProvider(): CustomerFamilyPaymentProvider | null {
  const credentials = configuredCredentials();
  if (!credentials) return null;

  return {
    async createOrder(input) {
      if (input.currency !== 'INR' || !Number.isFinite(input.amount) || input.amount <= 0) {
        throw new Error('PAYMENT_ORDER_INPUT_INVALID');
      }
      const amountPaise = Math.round(input.amount * 100);
      const response = await fetch(RAZORPAY_API + '/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader(credentials.keyId, credentials.keySecret),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: input.familyId.slice(0, 40),
          notes: { family_id: input.familyId },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
      const payload = await providerJson(response);
      if (
        typeof payload.id !== 'string' ||
        !payload.id.startsWith('order_') ||
        Number(payload.amount) !== amountPaise ||
        payload.currency !== 'INR' ||
        payload.status !== 'created'
      ) {
        throw new Error('PAYMENT_PROVIDER_INVALID_RESPONSE');
      }
      return { orderId: payload.id, amount: amountPaise / 100, currency: 'INR', status: 'created' };
    },

    async verifyPayment(input) {
      if (!verifyRazorpayCheckoutSignature({
        orderId: input.orderId,
        paymentId: input.paymentId,
        signature: input.signature,
        secret: credentials.keySecret,
      })) return { verified: false };

      const response = await fetch(RAZORPAY_API + '/payments/' + encodeURIComponent(input.paymentId), {
        method: 'GET',
        headers: {
          Authorization: authHeader(credentials.keyId, credentials.keySecret),
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
      const payment = await providerJson(response);
      return {
        verified:
          payment.order_id === input.orderId &&
          Number(payment.amount) === input.amountPaise &&
          payment.currency === 'INR' &&
          payment.status === 'captured' &&
          payment.captured === true,
      };
    },
  };
}
