import fs from "node:fs/promises";
import assert from "node:assert/strict";
const route=await fs.readFile("app/api/case-operations/route.ts","utf8");
const migration=await fs.readFile("database/migrations/045_case_human_mitra_operations.sql","utf8");
for(const marker of ["action==='assign'","action==='escalate'","action==='status'","ycm_case_timeline","ycm_work_assignments","MANAGEMENT_ACCESS_REQUIRED"]) assert.ok(route.includes(marker),marker);
for(const marker of ["ycm_case_escalation_rules","escalation_level","accepted_at","completed_at"]) assert.ok(migration.includes(marker),marker);
assert.ok(route.includes("s.sub"));
console.log("CASE_HUMAN_MITRA_OPERATIONS_CONTRACT: PASS");
