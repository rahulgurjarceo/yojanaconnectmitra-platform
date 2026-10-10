import fs from 'node:fs';
for(const p of ['app/api/finance/company/budget-report/route.ts','app/api/finance/company/assets/report/route.ts']){const a=fs.readFileSync(p,'utf8');for(const n of ['AUTHENTICATION_REQUIRED','assertCompanyFinanceRole','no-store'])if(!a.includes(n))throw new Error(p+' missing '+n)}
console.log('Finance reporting access contracts OK');

const p=fs.readFileSync('app/api/payout-destinations/route.ts','utf8');
for(const n of ['PAYOUT_DESTINATION_TEXT_TOO_LONG','BANK_IFSC_INVALID','UPI_ID_INVALID','PAYOUT_DESTINATION_FIELDS_REQUIRED'])if(!p.includes(n))throw new Error('payout contract missing '+n);
