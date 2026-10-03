import fs from 'node:fs';
const a=fs.readFileSync('app/lib/ycm-company-revenue.ts','utf8');const d=fs.readFileSync('app/api/finance/company/reconciliation/daily/route.ts','utf8');
for(const n of ['ON CONFLICT(external_reference) DO NOTHING','REVENUE_AMOUNT_INVALID'])if(!a.includes(n))throw new Error('revenue idempotency missing '+n);for(const n of ['90 days','private, no-store','assertCompanyFinanceRole'])if(!d.includes(n))throw new Error('reconciliation contract missing '+n);console.log('Revenue idempotency and reconciliation contracts OK');
