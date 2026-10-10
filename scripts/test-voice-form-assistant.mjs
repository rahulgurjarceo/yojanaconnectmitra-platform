import fs from 'node:fs';
import assert from 'node:assert/strict';
const m=fs.readFileSync('database/migrations/057_voice_form_fields.sql','utf8');
const a=fs.readFileSync('app/api/ai-mitra/form-fields/route.ts','utf8');
assert.match(m,/voice_prompt_hi/);assert.match(m,/field_key/);assert.match(m,/sequence_no/);
assert.match(a,/ycm_service_form_fields/);assert.match(a,/guided-field-by-field/);
console.log('VOICE_FORM_ASSISTANT_CONTRACT: PASS');
