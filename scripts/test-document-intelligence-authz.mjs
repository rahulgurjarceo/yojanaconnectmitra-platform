import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const createRoute = await fs.readFile('app/api/document-intelligence/route.ts', 'utf8');
const validateRoute = await fs.readFile('app/api/document-intelligence/validate/route.ts', 'utf8');

for (const [name, source] of [['OCR create', createRoute], ['document validate', validateRoute]]) {
  assert.match(source, /function familyAccessAllowed\\(session:ReturnType<typeof verifySession>,familyId:string\\)/, name + ' must define family-scoped access');
  assert.match(source, /\\['ceo','admin','management'\\]\\.includes\\(session\\.role\\)/, name + ' must limit cross-family access to platform leadership');
  assert.match(source, /return session\\.familyId===familyId/, name + ' must bind non-leadership users to their own family');
  assert.match(source, /FAMILY_ACCESS_DENIED/, name + ' must reject unauthorized family access');
  assert.doesNotMatch(source, /\\['ceo','admin','management','employee','partner','referral'\\]/, name + ' must not treat all staff/partners as globally authorized');
}

assert.ok(createRoute.indexOf('familyAccessAllowed(s,b.familyId)') < createRoute.indexOf('const sql=getDb()'), 'OCR create must authorize family before opening database work');
assert.ok(validateRoute.indexOf('familyAccessAllowed(s,d.family_id)') > validateRoute.indexOf('WHERE d.document_id=') , 'document validation must authorize the loaded document family before returning results');
console.log('DOCUMENT_INTELLIGENCE_FAMILY_AUTHZ_CONTRACT: PASS');
