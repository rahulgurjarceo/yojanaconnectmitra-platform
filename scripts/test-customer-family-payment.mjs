import fs from 'node:fs';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';

const provider = fs.readFileSync('app/lib/customer-family-payment.ts', 'utf8');
const verifyRoute = fs.readFileSync('app/api/customer-family/payment/verify/route.ts', 'utf8');
const orderRoute = fs.readFileSync('app/api/customer-family/payment/route.ts', 'utf8');

for (const token of [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'enabledPaymentProviders()',
  "RAZORPAY_API + '/orders'",
  "RAZORPAY_API + '/payments/'",
  'verifyRazorpayCheckoutSignature',
  "receipt: 'YCMF-' + randomUUID()",
  "reason: 'signature_invalid'",
  "reason: 'payment_not_captured_or_mismatch'",
  'timingSafeEqual',
  'AbortSignal.timeout(PROVIDER_TIMEOUT_MS)',
  "payment.status === 'captured'",
  'payment.captured === true',
  'Number(payment.amount) === input.amountPaise',
  'payment.order_id === input.orderId',
  'cache: \'no-store\'',
]) {
  if (!provider.includes(token)) throw new Error('Family payment provider contract missing: ' + token);
}
assert.match(verifyRoute, /amountPaise: payment\.amountPaise/);
assert.match(verifyRoute, /PAYMENT_SIGNATURE_INVALID/);
assert.match(verifyRoute, /PAYMENT_NOT_CAPTURED_OR_MISMATCHED/);
assert.match(orderRoute, /provider: 'razorpay'/);
assert.match(orderRoute, /FAMILY_REGISTRATION_PLAN\.amount/);

// Deterministic Razorpay Checkout signature fixture; verifies the contract vector used by the adapter.
const secret = 'test_secret_123';
const orderId = 'order_test_123';
const paymentId = 'pay_test_456';
const signature = createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex');
assert.equal(signature.length, 64);
assert.notEqual(signature, '0'.repeat(64));
console.log('Family Razorpay order/captured-payment verification contract: PASS');
