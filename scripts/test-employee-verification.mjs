import fs from 'node:fs';
const migration=fs.readFileSync('database/migrations/052_employee_verification_vetting.sql','utf8');
const route=fs.readFileSync('app/api/employee/verification/route.ts','utf8');
for (const marker of [
  "ycm_employee_verifications","status TEXT NOT NULL DEFAULT 'pending'","test_score",
  "ycm_employee_verification_events","event_type","UNIQUE(user_id)",
  "MANAGER_AUTH_REQUIRED","EMPLOYEE_SCOPE_DENIED","TEST_SCORE_INVALID","EMPLOYEE_NOT_FOUND",
  "NOTES_TOO_LONG","METADATA_INVALID","METADATA_TOO_LARGE",
  "status=EXCLUDED.status","event_type,score,details,actor_user_id","eventType = status === 'pending' ? 'note' : status",
  "LEFT JOIN ycm_users u ON u.user_id=v.user_id","LIMIT 500"
]) {
  if (!migration.includes(marker) && !route.includes(marker)) throw new Error('Missing employee verification contract: '+marker);
}
if (!route.includes("const managers = new Set(['team_lead','branch_manager','management','ceo','admin'])")) throw new Error('Manager role scope missing');
console.log('Employee verification / vetting contract: PASS');

const employeeUi=fs.readFileSync('app/employee/page.tsx','utf8');
const managerUi=fs.readFileSync('app/management/employee-verification/page.tsx','utf8');
for (const marker of ["loadVerification()","/api/employee/verification","Employee verification","PENDING REVIEW"]) {
  if (!employeeUi.includes(marker)) throw new Error('Employee verification UI marker missing: '+marker);
}
for (const marker of ["Employee Verification & Vetting","Set verified","Set suspended","/api/employee/verification"]) {
  if (!managerUi.includes(marker)) throw new Error('Manager verification UI marker missing: '+marker);
}
console.log('Employee verification / vetting UI contract: PASS');
