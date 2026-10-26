import fs from "node:fs/promises";
import assert from "node:assert/strict";

const route=await fs.readFile("app/api/financial/transactions/route.ts","utf8");

assert.match(route,/timingSafeEqual/);
assert.match(route,/Buffer\.from\(providedWebhookSecret,'utf8'\)/);
assert.match(route,/Buffer\.from\(webhookSecret,'utf8'\)/);
assert.match(route,/providedWebhookBytes\.length===webhookSecretBytes\.length/);
assert.match(route,/Buffer\.from\(providedWebhookSecret,'utf8'\)/);
assert.match(route,/Buffer\.from\(webhookSecret,'utf8'\)/);
assert.match(route,/webhookSecretBytes\.length>0/);
assert.match(route,/x-ycm-financial-secret/);
assert.match(route,/TRANSACTION_REFERENCE_INVALID/);
assert.match(route,/TRANSACTION_METADATA_INVALID/);
assert.match(route,/32768/);

console.log("FINANCIAL_WEBHOOK_SECURITY_CONTRACT_TEST: PASS");
