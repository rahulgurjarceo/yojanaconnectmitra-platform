import fs from 'node:fs';
import assert from 'node:assert/strict';

const page=fs.readFileSync('app/finance-dashboard/page.tsx','utf8');
const route=fs.readFileSync('app/api/finance/company/expenses/route.ts','utf8');
const summary=fs.readFileSync('app/api/finance/company/summary/route.ts','utf8');
const approval=fs.readFileSync('app/api/finance/company/expenses/approval/route.ts','utf8');

for(const token of ['/api/finance/company/summary?months=12','/api/finance/company/expenses?limit=150','/api/finance/company/expenses/approval','Company Finance Dashboard','CSV डाउनलोड','Draft खर्च सेव करें','Revenue − recorded expense']) assert.ok(page.includes(token),'dashboard missing '+token);
for(const token of ['export async function GET','AUTHENTICATION_REQUIRED','FORBIDDEN','ycm_company_expenses','posted_amount_paise','draft_amount_paise','Cache-Control']) assert.ok(route.includes(token),'expense route missing '+token);
for(const token of ['verifySession','assertCompanyFinanceRole','getCompanyFinancialControlSummary']) assert.ok(summary.includes(token),'summary auth/data contract missing '+token);
for(const token of ['EXPENSE_STATE_TRANSITION_INVALID','COMPANY_EXPENSE_APPROVAL_CHANGED','EXPENSE_NOT_APPROVABLE']) assert.ok(approval.includes(token),'approval state guard missing '+token);
console.log('Company finance dashboard contract OK');
