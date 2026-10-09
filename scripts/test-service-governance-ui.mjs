import fs from "node:fs/promises";
import assert from "node:assert/strict";
const api=await fs.readFile("app/api/service-master/route.ts","utf8");
const ui=await fs.readFile("app/service-master/page.tsx","utf8");
const policy=await fs.readFile("app/lib/ycm-service-governance.ts","utf8");
assert.match(api,/includeAll/);
// Management may submit/pause but cannot approve or publish a service.
assert.match(policy,/management:\s*\[[^\]]*service:create[^\]]*service:submit[^\]]*service:pause/s);
assert.doesNotMatch(policy,/management:\s*\[[^\]]*service:approve/s);
assert.doesNotMatch(policy,/management:\s*\[[^\]]*service:publish/s);
// Archiving requires a dedicated permission; edit rights alone are insufficient.
assert.match(policy,/to === 'archived'.*hasServicePermission\(role, 'service:archive'\)/s);
assert.doesNotMatch(policy,/employee:\s*\[[^\]]*service:archive/s);
assert.match(api,/canManage\(s\.role\)/);
assert.match(api,/export async function POST/);
assert.match(api,/export async function PATCH/);
assert.match(ui,/\/api\/service-master\?includeAll=true/);
assert.match(ui,/Add service/);
assert.match(ui,/Edit service/);
assert.match(ui,/Status/);
assert.match(ui,/requiresProvider/);
assert.match(ui,/Provider credentials/);
console.log("SERVICE_GOVERNANCE_UI_CONTRACT_TEST: PASS");