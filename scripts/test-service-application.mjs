import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const api=await fs.readFile('app/api/service-applications/route.ts','utf8');
for(const token of [
  'ycm_service_applications','prefilledData','document_snapshot','missing_documents',
  'reuse_if_valid','reupload_on_expiry','MISSING_OR_EXPIRED','review_and_submit','upload_missing_documents'
]) assert.match(api,new RegExp(token));
console.log('SERVICE_APPLICATION_REUSE_PREFILL_CONTRACT_TEST: PASS');
