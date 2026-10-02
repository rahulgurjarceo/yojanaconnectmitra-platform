import fs from "node:fs/promises";
import assert from "node:assert/strict";

const migration=await fs.readFile("database/migrations/023_individual_family_memberships.sql","utf8");
const register=await fs.readFile("app/api/auth/register/route.ts","utf8");
const login=await fs.readFile("app/api/auth/login/route.ts","utf8");

assert.match(migration,/membership_type TEXT NOT NULL CHECK/);
assert.match(migration,/9900/);
assert.match(migration,/YCM_99_1Y/);
assert.match(migration,/YCM_99_DEFENSE_2Y/);
assert.match(migration,/YCM_99_WIDOW_2Y/);
assert.match(migration,/validity_years INTEGER NOT NULL DEFAULT 1/);
assert.match(migration,/membership_type = 'individual' AND family_id IS NULL/);
assert.match(register,/accountType/);
assert.match(register,/individual/);
assert.match(register,/family/);
assert.match(register,/amount:99/);
assert.match(register,/membershipSegment/);
assert.match(register,/defense_family/);
assert.match(register,/widow_household/);
assert.match(register,/validityYears:Number\(membership\.validity_years\)/);
assert.match(login,/getUserPrimaryMembership/);
assert.doesNotMatch(login,/familyId:user\.user_id/);

console.log("INDIVIDUAL_FAMILY_MEMBERSHIP_CONTRACT_TEST: PASS");
