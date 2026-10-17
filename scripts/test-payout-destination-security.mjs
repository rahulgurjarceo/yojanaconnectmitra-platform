import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const route = await fs.readFile(path.join(process.cwd(), "app/api/payout-destinations/route.ts"), "utf8");
assert.match(route, /verifySession\(r\.cookies\.get\(sessionCookieName\(\)\)\?\.value\)/);
assert.match(route, /WHERE destination_id=\\\$\{b\.destinationId\} AND user_id=\\\$\{user\.id\}/);
assert.match(route, /PAYOUT_DESTINATION_VERIFICATION_REQUIRED/);
assert.match(route, /bank_account_last4/);
assert.doesNotMatch(route, /bank_account_number/);
console.log("PAYOUT_DESTINATION_SECURITY_CONTRACT_TEST: PASS");
