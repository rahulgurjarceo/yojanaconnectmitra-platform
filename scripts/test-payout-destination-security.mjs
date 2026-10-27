import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const route = await fs.readFile(path.join(process.cwd(), "app/api/payout-destinations/route.ts"), "utf8");
assert.match(route, /verifySession\(r\.cookies\.get\(sessionCookieName\(\)\)\?\.value\)/);
assert.match(route, /WHERE destination_id=\$\{b\.destinationId\} AND user_id=\$\{user\.id\}/);
assert.match(route, /PAYOUT_DESTINATION_VERIFICATION_REQUIRED/);
assert.match(route, /bank_account_last4/);
assert.doesNotMatch(route, /bank_account_number/);
assert.match(route, /PAYOUT_DESTINATION_STATUS_INVALID/);
assert.match(route, /typeof b\.isDefault!=='boolean'/);
assert.match(route, /sql\.begin\(async tx=>/);
assert.match(route, /Confirm ownership before changing any default flags/);
assert.match(route, /PAYOUT_DESTINATION_UPDATE_FAILED/);
assert.match(route, /PAYOUT_DESTINATION_CREATE_FAILED/);
assert.doesNotMatch(route, /code:e instanceof Error\?e\.message/);
console.log("PAYOUT_DESTINATION_SECURITY_CONTRACT_TEST: PASS");
