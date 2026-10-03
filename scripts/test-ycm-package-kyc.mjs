import fs from 'node:fs';
const required=[
 'database/migrations/032_ycm_packages_entitlements_kyc.sql',
 'app/lib/eko-kyc.ts'
];
for(const f of required)if(!fs.existsSync(f))throw new Error('MISSING_'+f);
const m=fs.readFileSync(required[0],'utf8');
for(const t of ['YCM_ONE_START','YCM_ONE_PRO','YCM_ONE_BUSINESS','YCM_ONE_ENTERPRISE','YCM_FINTECH_ID','PAN_VERIFICATION','BANK_ACCOUNT_VERIFICATION','AEPS_TRANSACTION','PAYMENT_GATEWAY','ycm_identity_verifications'])if(!m.includes(t))throw new Error('MISSING_'+t);
const k=fs.readFileSync(required[1],'utf8');
for(const t of ['/ekoapi/v3/tools/kyc/touras/pan-verification','/ekoapi/v3/tools/kyc/bank-account/sync','/ekoapi/v3/tools/kyc/touras/bank-acc-verify-pennyless','/ekoapi/v3/tools/kyc/mobile/otp/verify'])if(!k.includes(t))throw new Error('MISSING_EKO_KYC_'+t);
if(/d2fe1d99|0e60d3f8|becbbce45/.test(k))throw new Error('HARDCODED_EKO_CREDENTIAL');
console.log('YCM package/KYC contract checks passed');