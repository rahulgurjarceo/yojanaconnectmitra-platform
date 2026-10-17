import fs from 'node:fs';

const rbac = fs.readFileSync('app/lib/ycm-government-rbac.ts','utf8');
const route = fs.readFileSync('app/api/government/route.ts','utf8');

const requiredRbac = [
  'governmentScopeAllows',
  "session.role !== 'branch_manager'",
  'ycm_government_manager_scopes',
  'normalizeScopeRow(row)',
  'scopeMatches(normalizeScopeRow(row), target)',
];
for (const marker of requiredRbac) {
  if (!rbac.includes(marker)) throw new Error(`missing government scope enforcement marker: ${marker}`);
}

const requiredRoute = [
  "session.role === 'branch_manager'",
  'GOVERNMENT_SCOPE_REQUIRED',
  'GOVERNMENT_SCOPE_DENIED',
  'governmentScopeAllows(session',
  'scopeMatches(requestScope, targetScope)',
  'GOVERNMENT_CONTACT_NOT_VERIFIED',
  'GOVERNMENT_CONTACT_SCOPE_DENIED',
  'ycm_government_contacts',
];
for (const marker of requiredRoute) {
  if (!route.includes(marker)) throw new Error(`missing government route scope guard: ${marker}`);
}

if (!route.includes("geographyLevel: blockCode ? 'block' : 'district'")) {
  throw new Error('missing district/block target scope selection');
}

console.log('GOVERNMENT_RBAC_SCOPE_CONTRACT: PASS');
