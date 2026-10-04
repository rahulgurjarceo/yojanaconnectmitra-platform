import fs from 'node:fs';
const p=fs.readFileSync('app/lib/ycm-api-request-policy.ts','utf8');
const m=fs.readFileSync('middleware.ts','utf8');
for(const n of ['MAX_BODY_BYTES','ORIGIN_POLICY_DENIED','REQUEST_BODY_TOO_LARGE','CONTENT_TYPE_NOT_ALLOWED','sec-fetch-site','same-origin','same-site'])if(!p.includes(n))throw new Error('policy missing '+n);
if(!m.includes('enforceApiRequestPolicy'))throw new Error('middleware policy not wired');
if(!m.includes('Strict-Transport-Security'))throw new Error('missing production HSTS');
if(!m.includes("max-age=31536000; includeSubDomains"))throw new Error('invalid HSTS policy');
console.log('API request security policy contract OK');
