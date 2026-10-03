import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const migration=await fs.readFile('database/migrations/039_service_lifecycle_document_rules.sql','utf8');
const serviceApi=await fs.readFile('app/api/service-master/route.ts','utf8');
for (const token of [
  'validity_days','expiry_warning_days','renewal_allowed','renewal_window_days','prefill_fields',
  'reuse_if_valid','reupload_on_expiry','ycm_service_applications','document_snapshot','missing_documents'
]) assert.match(migration,new RegExp(token));
for (const token of ['prefill','document','validity','serviceCode']) assert.match(serviceApi,new RegExp(token,'i'));
console.log('SERVICE_LIFECYCLE_CONTRACT_TEST: PASS');
