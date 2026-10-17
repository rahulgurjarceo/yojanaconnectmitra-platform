import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const route=await fs.readFile('app/api/family-requirements/route.ts','utf8');
const evaluate=await fs.readFile('app/api/family-requirements/evaluate/route.ts','utf8');
assert.match(evaluate,/Sensitive family\/member\/document data must never be exposed by role alone/);
assert.match(evaluate,/const managementRoles = \['ceo', 'admin', 'management'\]/);
assert.match(evaluate,/!managementRoles\.includes\(session\.role\) && session\.familyId !== body\.familyId/);
assert.doesNotMatch(evaluate,/const serviceRoles = \['employee', 'partner', 'referral'\]/);
assert.match(evaluate,/FAMILY_ACCESS_DENIED/);

// Both read and evaluate endpoints must enforce family ownership for non-management roles.
assert.match(route,/const managementRoles = \['ceo', 'admin', 'management'\]/);
assert.match(route,/!managementRoles\.includes\(session\.role\) && session\.familyId !== familyId/);
assert.doesNotMatch(route,/const privileged = \['ceo', 'admin', 'management', 'employee', 'partner', 'referral'\]/);
assert.match(route,/FAMILY_ACCESS_DENIED/);
console.log('FAMILY-REQUIREMENTS-AUTHZ-CONTRACT: PASS');
