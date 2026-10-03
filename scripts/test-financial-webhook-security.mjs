import fs from "node:fs/promises";
import assert from "node:assert/strict";

const route=await fs.readFile("app/api/financial/transactions/route.ts","utf8");

assert.match(route,/timingSafeEqual/);
assert.match(route,/Buffer\.from\(providedWebhookSecret\)/);
assert.match(route,/Buffer\.from\(webhookSecret\)/);
assert.match(route,/providedWebhookSecret\.length===webhookSecret\.length/);
assert.match(route,/x-ycm-financial-secret/);

console.log("FINANCIAL_WEBHOOK_SECURITY_CONTRACT_TEST: PASS");

const route=await (await import('node:fs/promises')).readFile('app/api/financial/transactions/route.ts','utf8');
import assert from 'node:assert/strict';
assert.match(route,/TRANSACTION_REFERENCE_INVALID/);
assert.match(route,/TRANSACTION_METADATA_INVALID/);
assert.match(route,/32768/);
