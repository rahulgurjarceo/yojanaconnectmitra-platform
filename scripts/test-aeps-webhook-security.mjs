import fs from "node:fs/promises";
import assert from "node:assert/strict";

const route=await fs.readFile("app/api/aeps/transactions/route.ts","utf8");
assert.match(route,/timingSafeEqual/);
assert.match(route,/YCM_AEPS_WEBHOOK_SECRET/);
assert.match(route,/supplied\.length===configured\.length/);
assert.match(route,/Buffer\.from\(supplied\)/);
assert.match(route,/Buffer\.from\(configured\)/);
assert.match(route,/x-ycm-aeps-secret/);
console.log("AEPS_WEBHOOK_SECURITY_CONTRACT_TEST: PASS");
