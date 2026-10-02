import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const migration=await fs.readFile(path.join(process.cwd(),"database/migrations/022_unified_lead_intake.sql"),"utf8");
for(const token of ["ycm_leads","ycm_lead_service_matches","ycm_lead_events","service_code"]) assert.match(migration,new RegExp(token));
assert.match(migration,/ycm_service_master/);
assert.match(migration,/converted/);
console.log("UNIFIED_LEAD_INTAKE_CONTRACT_TEST: PASS");
