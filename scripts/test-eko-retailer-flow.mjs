import fs from 'node:fs';
const files=[
 'database/migrations/035_eko_aeps_retailer_transactions.sql',
 'app/lib/eko-transaction-inquiry.ts',
 'app/lib/eko-user-services.ts',
 'app/api/management/eko/retailers/route.ts',
 'app/api/aeps/eko/transactions/route.ts',
 'app/api/integrations/eko/aeps/callback/route.ts',
 'app/api/aeps/eko/inquiry/route.ts',
 'app/api/management/eko/retailers/sync-status/route.ts'
];
for(const f of files)if(!fs.existsSync(f))throw new Error('MISSING_'+f);
const migration=fs.readFileSync(files[0],'utf8');
for(const token of ['ycm_eko_retailer_accounts','ycm_eko_aeps_transactions','eko_user_code','client_ref_id','inquiry_required'])if(!migration.includes(token))throw new Error('MISSING_MIGRATION_TOKEN_'+token);
const inquiry=fs.readFileSync(files[1],'utf8');
for(const token of ['/ekoapi/v3/tools/reference/transaction','initiator_id','user_code','secret-key'])if(!inquiry.includes(token))throw new Error('MISSING_INQUIRY_TOKEN_'+token);
const callback=fs.readFileSync(files[5],'utf8');
for(const token of ['debit-hook','eko-response','request_hash_params','recordSuccessfulFinancialTransaction','reverseFinancialTransaction','EKO_CALLBACK_SHARED_SECRET','EKO_CALLBACK_AUTHENTICATION_FAILED','timingSafeEqual'])if(!callback.includes(token))throw new Error('MISSING_CALLBACK_TOKEN_'+token);
const initiate=fs.readFileSync(files[4],'utf8');
for(const token of ['EKO_RETAILER_NOT_BOUND','EKO_RETAILER_NOT_ACTIVE','ycm_eko_aeps_transactions','FIN_AEPS'])if(!initiate.includes(token))throw new Error('MISSING_INITIATE_TOKEN_'+token);
for(const f of files){const c=fs.readFileSync(f,'utf8');if(/f74c50a1|4CKAzpT/.test(c))throw new Error('HARDCODED_EKO_SECRET_'+f);}
console.log('Eko AePS retailer/inquiry/callback contract checks passed');
const retailer=fs.readFileSync('app/api/management/eko/retailers/route.ts','utf8');
for(const token of ['EKO_DAILY_AUTH_DATE_INVALID','EKO_DATE_INVALID','ON CONFLICT(user_id)','INSERT INTO ycm_eko_retailer_accounts'])if(!retailer.includes(token))throw new Error('MISSING_RETAILER_HARDENING_'+token);
const inquiryRoute=fs.readFileSync('app/api/aeps/eko/inquiry/route.ts','utf8');
for(const token of ["status IN ('success','failed','reversed') AND status<>$1","const persistedStatus=String(saved?.status??'')","applyLedgerForPersistedStatus(persistedStatus,saved,result)","last_inquired_at=NOW()","TRANSACTION_NOT_FOUND"])if(!inquiryRoute.includes(token))throw new Error('MISSING_INQUIRY_REPLAY_GUARD_'+token);
if(inquiryRoute.includes("reverseFinancialTransaction('aeps:'+tx.client_ref_id).catch(()=>null)"))throw new Error('INQUIRY_REVERSAL_ERRORS_MUST_NOT_BE_SILENTLY_SWALLOWED');
console.log('Eko inquiry terminal-state and ledger-replay checks passed');
