import fs from "node:fs/promises";
import assert from "node:assert/strict";

const route = await fs.readFile("app/api/customer-family/payment/route.ts", "utf8");
const verify = await fs.readFile("app/api/customer-family/payment/verify/route.ts", "utf8");
const activation = await fs.readFile("app/api/customer-family/activation/route.ts", "utf8");

assert.match(route, /getCustomerFamilyPaymentProvider/);
assert.match(route, /requireFamilyOwner/);
assert.match(route, /provider\.createOrder/);
assert.match(route, /repository\.createPayment/);
assert.match(route, /amountPaise: FAMILY_REGISTRATION_PLAN\.amount \* 100/);
assert.match(route, /status !== 'pending_payment'/);

assert.match(verify, /provider\.verifyPayment/);
assert.match(verify, /signature/);
assert.match(verify, /markPaymentVerified/);
assert.match(verify, /PAYMENT_SIGNATURE_INVALID/);

assert.match(activation, /getActivationState/);
assert.match(activation, /otpVerified/);
assert.match(activation, /paymentVerified/);
assert.match(activation, /updateStatus\(family\.familyId, 'active'\)/);

console.log("FAMILY_PAYMENT_ACTIVATION_CONTRACT_TEST: PASS");
