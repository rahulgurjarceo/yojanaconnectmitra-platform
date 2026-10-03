import fs from 'node:fs';
const a=fs.readFileSync('app/api/finance/company/assets/route.ts','utf8');
for(const n of ['ycm_company_assets','COMPANY_ASSET_CREATED','purchaseAmountPaise','AUTHENTICATION_REQUIRED','FORBIDDEN'])if(!a.includes(n))throw new Error('asset contract missing '+n);
console.log('Company asset register contract OK');
