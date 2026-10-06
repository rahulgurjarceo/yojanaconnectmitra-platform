import fs from 'node:fs';
const migration=fs.readFileSync('database/migrations/052_employee_verification_vetting.sql','utf8');
const route=fs.readFileSync('app/api/employee/verification/route.ts','utf8');
for (const marker of [
  "ycm_employee_verifications","status TEXT NOT NULL DEFAULT 'pending'","test_score",
  "ycm_employee_verification_events","event_type","UNIQUE(user_id)",
  "MANAGER_AUTH_REQUIRED","EMPLOYEE_SCOPE_DENIED","TEST_SCORE_INVALID",
  "status=EXCLUDED.status","event_type,score,details,actor_user_id"
]) {
  if (!migration.includes(marker) && !route.includes(marker)) throw new Error('Missing employee verification contract: '+marker);
}
if (!route.includes("const managers = new Set(['team_lead','branch_manager','management','ceo','admin'])")) throw new Error('Manager role scope missing');
console.log('Employee verification / vetting contract: PASS');
