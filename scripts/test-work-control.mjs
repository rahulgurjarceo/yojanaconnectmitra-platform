import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root=process.cwd();
const work=await fs.readFile(path.join(root,"app/api/work-assignments/route.ts"),"utf8");
const target=await fs.readFile(path.join(root,"app/api/org-targets/route.ts"),"utf8");
const migration=await fs.readFile(path.join(root,"database/migrations/016_work_approval_and_org_targets.sql"),"utf8");

assert.match(work,/approvalStatus/);
assert.match(work,/APPROVAL_ACCESS_DENIED/);
assert.match(work,/WORK_MUST_BE_COMPLETED_BEFORE_APPROVAL/);
assert.match(work,/employee_result/);
assert.match(work,/employee_note/);
assert.match(work,/submitted_at/);
assert.match(work,/EMPLOYEE_CANNOT_CHANGE_CONTROL_FIELDS/);
assert.match(work,/role==='team_lead'/);

assert.match(target,/targetType/);
assert.match(target,/company/);
assert.match(target,/state/);
assert.match(target,/district/);
assert.match(target,/block/);
assert.match(target,/franchise/);
assert.match(target,/team/);
assert.match(target,/employee/);
assert.match(target,/parentTargetId/);
assert.match(target,/TEAM_LEAD_CAN_ONLY_SET_EMPLOYEE_TARGETS/);

assert.match(migration,/approval_status/);
assert.match(migration,/reviewed_by/);
assert.match(migration,/ycm_org_targets/);
assert.match(migration,/parent_target_id/);
const geo=await fs.readFile(path.join(root,"database/migrations/017_geographic_franchise_targets.sql"),"utf8");
assert.match(geo,/state_code/);
assert.match(geo,/district_code/);
assert.match(geo,/block_code/);
assert.match(geo,/franchise_entity_id/);
assert.match(geo,/team_type/);
console.log("WORK_CONTROL_CONTRACT_TEST: PASS");
