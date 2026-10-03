import fs from 'node:fs';
const a=fs.readFileSync('app/api/finance/company/expenses/approval/route.ts','utf8');
for(const n of ['EXPENSE_STATE_TRANSITION_INVALID','COMPANY_EXPENSE_APPROVAL_CHANGED','FORBIDDEN','EXPENSE_NOT_APPROVABLE'])if(!a.includes(n))throw new Error('approval contract missing '+n);
console.log('Company expense approval contract OK');
