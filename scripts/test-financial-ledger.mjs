import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const required=[
 ['app/lib/ycm-financial-ledger.ts','resolveCommissionRule'],
 ['app/lib/ycm-financial-ledger.ts','resolveUserId'],
 ['app/api/aeps/transactions/route.ts','FIN_AEPS'],
 ['app/api/service-financial/transactions/route.ts','recordSuccessfulFinancialTransaction'],
 ['app/api/wallet/route.ts','ycm_wallet_accounts'],
 ['database/migrations/026_unified_transaction_commission_ledger.sql','ycm_financial_transactions'],
 ['database/migrations/027_default_commission_rule.sql','60,40,0'],
 ['database/migrations/028_aeps_financial_service.sql','FIN_AEPS']
];
for(const [file,needle] of required){
 const c=read(file);
 if(!c.includes(needle)) throw new Error(`FINANCIAL_CONTRACT_FAILED: ${file} missing ${needle}`);
}
const ledger=read('app/lib/ycm-financial-ledger.ts');
if(/rule:\s*\{/.test(read('app/api/aeps/transactions/route.ts'))||/rule:\s*\{/.test(read('app/api/service-financial/transactions/route.ts'))) throw new Error('FINANCIAL_CONTRACT_FAILED: webhook may override commission rule');
if(!ledger.includes("status='active'")||!ledger.includes("service_code IS NULL")) throw new Error('FINANCIAL_CONTRACT_FAILED: central commission lookup incomplete');
console.log('Financial ledger contract checks passed.');
