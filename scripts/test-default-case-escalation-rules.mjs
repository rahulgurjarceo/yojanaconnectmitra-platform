import fs from "node:fs/promises";
import assert from "node:assert/strict";
const sql=await fs.readFile("database/migrations/046_default_case_escalation_rules.sql","utf8");
for (const trigger of ["tat_breach","cri_below","no_update","rejection"]) assert.ok(sql.includes(`'${trigger}'`),trigger);
assert.ok(sql.includes("active)"),"inactive-by-default");
assert.ok(sql.includes("ON CONFLICT DO NOTHING"),"idempotent");
console.log("CASE_ESCALATION_DEFAULT_RULES_CONTRACT: PASS");
