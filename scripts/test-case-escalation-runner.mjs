import fs from "node:fs/promises";
import assert from "node:assert/strict";
const worker=await fs.readFile("scripts/run-case-escalations.mjs","utf8");
for(const marker of ["tat_breach","cri_below","no_update","rejection","auto_escalated","escalation_level","ycm_case_timeline"]) assert.ok(worker.includes(marker),marker);
console.log("CASE_AUTOMATIC_ESCALATION_CONTRACT: PASS");
