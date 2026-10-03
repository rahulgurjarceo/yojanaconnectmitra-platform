import assert from 'node:assert/strict';
import fs from 'node:fs';
const client=fs.readFileSync('app/lib/jan-aadhaar-client.ts','utf8');
const crypto=fs.readFileSync('app/lib/jan-aadhaar-crypto.ts','utf8');
for(const n of ['memberList','generateOtp','validateOtp','piAuth','/member-list','/generate-otp','/validate-otp','/janaadhaar-piauth','JAN_AADHAAR_CLIENT_ID','X-Cert-Fingerprint','AbortSignal.timeout']) assert.ok(client.includes(n),'client: missing '+n);
for(const n of ['aes-256-cbc','RSA-SHA256','publicEncrypt','privateDecrypt','createVerify','randomBytes(32)','randomBytes(16)']) assert.ok(crypto.includes(n),'crypto: missing '+n);
assert.ok(!client.includes('JAN_AADHAAR_API_KEY'));
console.log('Jan Aadhaar integration contract OK');
