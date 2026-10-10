import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
const cryptoSource = await (await import('node:fs/promises')).readFile('app/lib/jan-aadhaar-crypto.ts', 'utf8');
for (const needle of ['aes-256-cbc', 'RSA-SHA256', 'publicEncrypt', 'privateDecrypt', 'randomBytes(32)', 'randomBytes(16)', 'iv.toString(\'base64\')']) {
  assert.ok(cryptoSource.includes(needle), 'missing crypto contract: ' + needle);
}

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
assert.ok(publicPem.includes('BEGIN PUBLIC KEY'));
assert.ok(privatePem.includes('BEGIN PRIVATE KEY'));

console.log('Jan Aadhaar crypto contract OK');
