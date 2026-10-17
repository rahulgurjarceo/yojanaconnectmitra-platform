import fs from 'node:fs';

const files = [
  'app/api/work-assignments/route.ts',
  'app/api/crm/customer-profile/route.ts',
  'app/api/compliance/requirements/route.ts',
  'app/api/service-applications/route.ts',
];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('requireVerifiedEmployee')) throw new Error('Missing employee verification enforcement import/call: '+file);
  if (!source.includes('employeeGate')) throw new Error('Missing centralized employee verification gate handling: '+file);
  if (!source.includes('status:403') && !source.includes('status: 403')) throw new Error('Missing fail-closed 403 response: '+file);
}
const helper = fs.readFileSync('app/lib/ycm-employee-verification.ts','utf8');
for (const marker of [
  "export async function getEmployeeVerificationStatus",
  "export async function requireVerifiedEmployee",
  "status !== 'verified'",
  "EMPLOYEE_VERIFICATION_REQUIRED",
  "verificationStatus",
]) {
  if (!helper.includes(marker)) throw new Error('Missing verification helper contract: '+marker);
}
console.log('Verified employee enforcement contract: PASS');
