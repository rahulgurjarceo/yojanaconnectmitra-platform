import { access } from 'node:fs/promises';
import path from 'node:path';

const required = [
  'app/login/page.tsx',
  'app/register/page.tsx',
  'app/family-dashboard/page.tsx',
  'app/command-center/page.tsx',
  'app/employee/page.tsx',
  'app/service-master/page.tsx',
  'app/case-universe/page.tsx',
  'app/compliance/page.tsx',
  'app/impact-proof/page.tsx',
  'app/education/page.tsx',
  'app/farmer/page.tsx',
  'app/legal-mitra/page.tsx',
  'app/management/page.tsx',
  'app/workspace/page.tsx',
  'app/api/auth/login/route.ts',
  'app/api/family/route.ts',
  'app/api/service-master/route.ts',
  'app/api/service-applications/route.ts',
  'app/api/operations/case-dispatch/route.ts',
  'app/api/case-operations/route.ts',
  'app/api/crm/leads/route.ts',
  'app/api/document-intelligence',
  'app/api/finance/company/summary/route.ts',
  'app/api/settlements/route.ts',
  'app/api/aeps/transactions/route.ts',
  'app/api/impact-proof/route.ts',
  'database/migrations/052_employee_verification_vetting.sql',
  '.github/workflows/ycm-one-ci.yml',
];

const missing = [];
for (const file of required) {
  try { await access(path.resolve(file)); } catch { missing.push(file); }
}
if (missing.length) {
  console.error('YCM ONE completion contract FAILED');
  console.error(missing.join('\
'));
  process.exit(1);
}
console.log('YCM ONE completion contract PASS — ' + required.length + ' core surfaces present.');
