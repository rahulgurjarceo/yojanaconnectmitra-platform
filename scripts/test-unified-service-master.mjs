import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('database/migrations/019_unified_service_master.sql','utf8');
const api=fs.readFileSync('app/api/service-master/route.ts','utf8');
const governance=fs.readFileSync('app/lib/ycm-service-governance.ts','utf8');
const aeps=fs.readFileSync('app/lib/ycm-aeps.ts','utf8');
for(const x of ['ycm_service_master','GOV_E_GOVERNMENT_ASSISTANCE','DOC_IDENTITY','DOC_OCR_VERIFICATION','TRAVEL_FLIGHT','TRAVEL_HOTEL','TRAVEL_PACKAGE']) if(!migration.includes(x)) throw new Error('missing '+x);
for(const x of ['ycm_service_master','service_type','business_domain_code']) if(!api.includes(x)) throw new Error('missing api '+x);
if(!api.includes("AND (${includeAll} OR status='active')")) throw new Error('service detail lookup must hide inactive/draft services from non-managers');
if(!api.includes("rows.some((row)=>row.service_code===serviceCode)")) throw new Error('service detail reads must reuse catalogue visibility filters');

const rolePermissions = (role) => {
  const match = governance.match(new RegExp(role + ':\\s*\\[([^\\]]+)\\]'));
  assert.ok(match, 'missing permissions for role ' + role);
  return match[1];
};
for (const role of ['ceo', 'admin']) {
  assert.match(rolePermissions(role), /service:approve/);
  assert.match(rolePermissions(role), /service:publish/);
  assert.match(rolePermissions(role), /service:archive/);
}
for (const role of ['management', 'employee']) {
  assert.doesNotMatch(rolePermissions(role), /service:approve|service:publish|service:archive/);
}
assert.match(governance, /to === 'published'.*service:publish.*from === 'pending_approval'/);
const aepsState = aeps.match(/export type YcmAepsTransactionState =([\s\S]*?);/);
assert.ok(aepsState, 'missing AEPS transaction state type');
assert.match(aepsState[1], /'reconciled'/);
assert.match(aeps, /state:\s*YcmAepsTransactionState/);
console.log('UNIFIED_SERVICE_MASTER_CONTRACT_TEST: PASS');
