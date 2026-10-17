import fs from 'node:fs';
const route = fs.readFileSync('app/api/family/route.ts','utf8');
const required = [
  "validateFamilyRegistrationPayload",
  "getPostgresCustomerFamilyRepository",
  "status: 'pending_payment'",
  "OTP verification",
  "Payment gateway signature verification",
  "DATABASE_NOT_CONFIGURED",
];
for (const marker of required) {
  if (!route.includes(marker)) throw new Error(`Missing family registration contract marker: ${marker}`);
}
if (route.includes("status: 'created-demo'") || route.includes("Math.random()")) {
  throw new Error('Demo-only family registration implementation is still present');
}
console.log('Family registration contract: PASS');
