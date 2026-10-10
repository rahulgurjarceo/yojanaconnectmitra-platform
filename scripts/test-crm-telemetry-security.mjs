import fs from "node:fs/promises";
import assert from "node:assert/strict";

const crm=await fs.readFile("app/api/crm/leads/route.ts","utf8");
assert.match(crm,/timingSafeEqual/);
assert.match(crm,/YCM_LEAD_WEBHOOK_SECRET/);
assert.match(crm,/x-ycm-lead-secret/);

const telemetry=await fs.readFile("app/api/integrations/employee-telemetry/route.ts","utf8");
assert.match(telemetry,/timingSafeEqual/);
assert.match(telemetry,/TELEMETRY_METADATA_INVALID/);
assert.match(telemetry,/32768/);
assert.match(telemetry,/jsonObject/);

console.log("CRM_TELEMETRY_SECURITY_CONTRACT_TEST: PASS");

assert.match(crm,/LEAD_INPUT_INVALID/);
assert.match(crm,/jsonSizeOk/);
assert.match(crm,/32768/);
assert.match(crm,/LEAD_CREATE_FAILED/);
assert.doesNotMatch(crm,/message:e instanceof Error/);
