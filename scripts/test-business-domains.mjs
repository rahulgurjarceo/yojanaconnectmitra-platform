import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root=process.cwd();
const universe=await fs.readFile(path.join(root,"app/case-universe.ts"),"utf8");
const migration=await fs.readFile(path.join(root,"database/migrations/018_business_domains_and_team_mapping.sql"),"utf8");
const catalog=await fs.readFile(path.join(root,"app/lib/ycm-team-domains.ts"),"utf8");

assert.match(universe,/CASE_UNIVERSE_COUNT/);
const domainRows=(universe.match(/\['[^']+','[^']+'/g)??[]).length;
assert.equal(domainRows,35,"CASE_UNIVERSE must contain 35 canonical domains");
assert.match(migration,/ycm_business_domains/);
assert.match(migration,/ycm_team_domains/);
assert.match(migration,/business_domain_code/);
assert.match(migration,/ON CONFLICT \(domain_code\) DO UPDATE/);
assert.match(catalog,/YCM_TEAM_FUNCTIONS/);
assert.match(catalog,/YCM_BUSINESS_DOMAINS/);
assert.match(catalog,/35/);
console.log("BUSINESS_DOMAIN_TEAM_CONTRACT_TEST: PASS");
