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
assert.match(route,/FINANCIAL_TRANSACTION_FAILED/);
assert.match(route,/FINANCIAL_REVERSAL_FAILED/);
if (route.includes("code:e instanceof Error?e.message")) throw new Error('Financial API must not expose raw internal errors');

console.log("FINANCIAL_WEBHOOK_SECURITY_CONTRACT_TEST: PASS");
