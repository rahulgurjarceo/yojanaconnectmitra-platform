import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const c=read('app/lib/eko-aeps.ts');
for(const needle of ['createHmac','EKO_ACCESS_KEY','EKO_DEVELOPER_KEY','requestHash','cash_withdrawal:2','balance_enquiry:3','mini_statement:4'])if(!c.includes(needle))throw new Error('EKO_CONTRACT_FAILED:'+needle);
if(c.includes('d2fe1d99-6298-4af2-8cc5-d97dcf46df30'))throw new Error('EKO_CONTRACT_FAILED:secret hard-coded');
if(!c.includes("if(v==='2')return 'inquiry_required';"))throw new Error('EKO_CONTRACT_FAILED:status 2 must require inquiry');
if(c.includes("if(v==='3'||v==='4')return 'reversed';"))throw new Error('EKO_CONTRACT_FAILED:unknown statuses must not reverse ledger');
console.log('Eko AePS contract checks passed.');
