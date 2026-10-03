import fs from 'node:fs';
for(const p of ['app/api/finance/company/budget-report/route.ts','app/api/finance/company/assets/report/route.ts']){const a=fs.readFileSync(p,'utf8');for(const n of ['AUTHENTICATION_REQUIRED','assertCompanyFinanceRole','no-store'])if(!a.includes(n))throw new Error(p+' missing '+n)}
console.log('Finance reporting access contracts OK');
