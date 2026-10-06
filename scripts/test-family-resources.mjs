import fs from "node:fs/promises";
import assert from "node:assert/strict";
const route=await fs.readFile("app/api/customer-family/resources/route.ts","utf8");
const repo=await fs.readFile("app/lib/customer-family-postgres.ts","utf8");
for(const marker of ["requireFamilyOwner","family.status !== 'active'","action === 'member'","action === 'consent'","action === 'document'","action === 'case'"]) assert.ok(route.includes(marker), marker);
for(const marker of ["createMember","createConsent","createDocument","createCase"]) assert.ok(repo.includes(marker), marker);
assert.ok(route.includes("randomUUID"));
console.log("FAMILY_RESOURCES_CONTRACT_TEST: PASS");
