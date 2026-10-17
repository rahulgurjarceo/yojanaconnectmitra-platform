import fs from 'node:fs';

const route = fs.readFileSync('app/api/crm/customer-profile/route.ts', 'utf8');

const required = [
  "const managers = new Set(['team_lead', 'branch_manager', 'management', 'ceo', 'admin'])",
  "const opportunityTypes = new Set(['job', 'scheme', 'scholarship', 'form', 'service', 'other'])",
  "const noteTypes = new Set(['general', 'job_prep', 'scheme', 'form', 'document', 'calling'])",
  "function safeHttpUrl",
  "['http:', 'https:'].includes(u.protocol)",
  "MAX_JSON_BYTES",
  "SHARE_VALUE_INVALID",
  "MANAGER_VISIBILITY_REQUIRED",
  "MANAGER_TARGET_REQUIRED",
  "FAMILY_SCOPE_DENIED",
  "SELECT opportunity_id, family_id, member_id",
  "SELECT note_id, family_id, member_id",
  "SELECT share_id, share_type, title, target",
];

for (const marker of required) {
  if (!route.includes(marker)) throw new Error(`Missing CRM security contract marker: ${marker}`);
}

if (route.includes("SELECT * FROM ycm_customer_opportunities")) throw new Error('Customer opportunity API must not return unrestricted SELECT * payloads');
if (route.includes("SELECT * FROM ycm_customer_notes")) throw new Error('Customer notes API must not return unrestricted SELECT * payloads');
if (route.includes("SELECT * FROM ycm_customer_shares")) throw new Error('Customer shares API must not return unrestricted SELECT * payloads');

console.log('Customer profile CRM security contract: PASS');
