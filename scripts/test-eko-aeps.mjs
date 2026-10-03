import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const c=read('app/lib/eko-aeps.ts');
for(const needle of ['createHmac','EKO_ACCESS_KEY','EKO_DEVELOPER_KEY','requestHash','cash_withdrawal:2','balance_enquiry:3','mini_statement:4'])if(!c.includes(needle))throw new Error('EKO_CONTRACT_FAILED:'+needle);
if(c.includes('d2fe1d99-6298-4af2-8cc5-d97dcf46df30'))throw new Error('EKO_CONTRACT_FAILED:secret hard-coded');
console.log('Eko AePS contract checks passed.');
