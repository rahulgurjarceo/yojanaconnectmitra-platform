import fs from "node:fs/promises";
import assert from "node:assert/strict";
const workflow=await fs.readFile(".github/workflows/ycm-case-escalation-worker.yml","utf8");
assert.ok(workflow.includes("schedule:"),"schedule");
assert.ok(workflow.includes("cron: '17 * * * *'"),"hourly cron");
assert.ok(workflow.includes("npm run case:escalate"),"runner");
assert.ok(workflow.includes("DATABASE_URL"),"database secret");
assert.ok(workflow.includes("permissions:\n  contents: read"),"least privilege");
console.log("CASE_ESCALATION_SCHEDULER_CONTRACT: PASS");
