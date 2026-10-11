import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const c=read('app/lib/eko-aeps.ts');
for(const needle of ['createHmac','EKO_ACCESS_KEY','EKO_DEVELOPER_KEY','requestHash','cash_withdrawal:2','balance_enquiry:3','mini_statement:4'])if(!c.includes(needle))throw new Error('EKO_CONTRACT_FAILED:'+needle);
if(c.includes('d2fe1d99-6298-4af2-8cc5-d97dcf46df30'))throw new Error('EKO_CONTRACT_FAILED:secret hard-coded');
if(!read('app/lib/ycm-aeps.ts').includes("| 'inquiry_required'"))throw new Error('EKO_CONTRACT_FAILED:inquiry_required state missing from provider contract');
if(!c.includes("if(v==='2')return 'inquiry_required';"))throw new Error('EKO_CONTRACT_FAILED:status 2 must require inquiry');
if(c.includes("if(v==='3'||v==='4')return 'reversed';"))throw new Error('EKO_CONTRACT_FAILED:unknown statuses must not reverse ledger');
console.log('Eko AePS contract checks passed.');

if(!c.includes("await import('./eko-transaction-inquiry')"))throw new Error('EKO_STATUS_MUST_USE_TRANSACTION_INQUIRY_ADAPTER');
for(const token of ['EKO_TRANSACTION_NOT_FOUND','EKO_RETAILER_USER_CODE_REQUIRED','client_ref_id=$1 OR eko_tid=$1','state:mapState(result.txStatus)'])if(!c.includes(token))throw new Error('MISSING_EKO_STATUS_INTEGRATION_'+token);
console.log('EKO provider status/inquiry adapter contract checks passed.');

if(!c.includes("const hashValues=[input.aadhaarForRequestHash,amount,userCode]"))throw new Error('EKO_REQUEST_HASH_MUST_USE_DOCUMENTED_AADHAAR_AMOUNT_USER_CODE_SEQUENCE');
if(!c.includes("EKO_AADHAAR_HASH_VALUE_INVALID"))throw new Error('EKO_REQUEST_HASH_MUST_VALIDATE_TRANSIENT_AADHAAR');
if(!read('app/api/aeps/eko/transactions/route.ts').includes('aadhaarForRequestHash:b.aadhaarForRequestHash!'))throw new Error('EKO_INITIATION_MUST_PASS_TRANSIENT_AADHAAR_HASH_VALUE');
console.log('EKO documented request-hash sequence checks passed.');
