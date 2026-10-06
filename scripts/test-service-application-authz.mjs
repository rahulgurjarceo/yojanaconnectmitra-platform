import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const api=await fs.readFile('app/api/service-applications/route.ts','utf8');
assert.match(api,/function familyAllowed/);
assert.match(api,/session\.familyId === familyId/);
assert.match(api,/FAMILY_ACCESS_DENIED/);
assert.match(api,/member_id=\$\{body\.memberId\}/);
assert.match(api,/family_id=\$\{familyId\} AND member_id=\$\{body\.memberId\}/);
assert.match(api,/FROM ycm_family_documents WHERE family_id=\$\{familyId\}/);
assert.match(api,/FROM ycm_document_intelligence WHERE family_id=\$\{familyId\}/);
assert.match(api,/\['ceo', 'admin', 'management'\]\.includes\(session\.role\)/);
assert.doesNotMatch(api,/\['ceo', 'admin', 'management', 'employee', 'partner', 'referral'\]\.includes\(session\.role\)/);
console.log('SERVICE_APPLICATION_AUTHZ_CONTRACT_TEST: PASS');
