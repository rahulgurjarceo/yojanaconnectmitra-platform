import fs from 'node:fs';

const path='app/api/integrations/eko/aeps/callback/route.ts';
const source=fs.readFileSync(path,'utf8');

if(!source.includes("status IN ('success','failed','reversed') AND status<>$1")) {
  throw new Error('EKO callback must not downgrade a terminal transaction state');
}
if(!source.includes("WHERE eko_transaction_id=$6 RETURNING *")) {
  throw new Error('EKO callback must update by immutable provider transaction id');
}
console.log('EKO callback terminal-state replay contract: PASS');
