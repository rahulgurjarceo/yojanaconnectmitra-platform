import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const route=await fs.readFile('app/api/integrations/eko/aeps/callback/route.ts','utf8');
assert.match(route,/existingStatus=String\(tx\.status/);
assert.match(route,/\['success','failed','reversed'\]\.includes\(existingStatus\)/);
assert.match(route,/idempotent:true/);
assert.match(route,/recordSuccessfulFinancialTransaction/);
assert.match(route,/reverseFinancialTransaction/);
assert.match(route,/client_ref_id=\$1 LIMIT 1/);
assert.match(route,/status IN \\\('success','failed','reversed'\\\)/);
assert.match(route,/status<>\\\\\$1/);
assert.match(route,/WHERE eko_transaction_id=\$6 RETURNING \*/);
console.log('AEPS_CALLBACK_REPLAY_CONTRACT_TEST: PASS');
