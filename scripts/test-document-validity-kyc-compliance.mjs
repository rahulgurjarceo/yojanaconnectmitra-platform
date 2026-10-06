import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const migration=await fs.readFile('database/migrations/049_document_validity_kyc_compliance.sql','utf8');
const route=await fs.readFile('app/api/compliance/requirements/route.ts','utf8');
const leads=await fs.readFile('app/api/crm/leads/route.ts','utf8');

assert.match(migration,/ycm_document_validity_rules/);
assert.match(migration,/validity_days INTEGER/);
assert.match(migration,/application_deadline/);
assert.match(migration,/ycm_compliance_schedules/);
assert.match(migration,/requirement_type VARCHAR\(32\)/);
assert.match(migration,/CHECK \(requirement_type IN \('document','kyc'\)\)/);
assert.match(migration,/frequency_days INTEGER/);
assert.match(migration,/next_due_at TIMESTAMPTZ/);
assert.match(migration,/ycm_compliance_reminders/);
assert.match(migration,/upcoming.*due.*overdue.*missing/s);
assert.match(route,/ycm_compliance_schedules/);
assert.match(route,/requirementType/);
assert.match(route,/assigned_employee_id/);
assert.match(route,/assigned_manager_id/);
assert.match(route,/nextDueAt/);
assert.match(route,/complete/);
assert.match(leads,/compliance_due_count/);
assert.match(leads,/compliance_overdue_count/);
assert.match(leads,/next_compliance_due_at/);
assert.match(leads,/branch_manager/);
console.log('DOCUMENT_VALIDITY_KYC_COMPLIANCE_CONTRACT: PASS');
