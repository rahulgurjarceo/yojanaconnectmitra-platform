import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const route=await fs.readFile('app/api/family-requirements/evaluate/route.ts','utf8');
assert.match(route,/Sensitive family\/member\/document data must never be exposed by role alone/);
assert.match(route,/const managementRoles = \['ceo', 'admin', 'management'\]/);
assert.match(route,/!managementRoles\.includes\(session\.role\) && session\.familyId !== body\.familyId/);
assert.doesNotMatch(route,/const serviceRoles = \['employee', 'partner', 'referral'\]/);
assert.match(route,/FAMILY_ACCESS_DENIED/);
console.log('FAMILY-REQUIREMENTS-AUTHZ-CONTRACT: PASS');
