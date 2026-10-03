import { createCipheriv, createDecipheriv, createPrivateKey, createPublicKey, createSign, privateDecrypt, publicEncrypt, randomBytes } from 'node:crypto';

const AES_ALGORITHM = 'aes-256-cbc';
const RSA_PADDING = { padding: 1 } as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(name + '_NOT_CONFIGURED');
  return value;
}

function decodeKey(value: string): string {
  return value.includes('BEGIN ') ? value : Buffer.from(value, 'base64').toString('utf8');
}

export function signJanAadhaarPayload(data: string, privateKeyPem = requireEnv('JAN_AADHAAR_SIGNING_PRIVATE_KEY')): string {
  const signer = createSign('RSA-SHA256');
  signer.update(data, 'utf8');
  signer.end();
  return signer.sign(createPrivateKey(decodeKey(privateKeyPem))).toString('base64');
}

export function encryptJanAadhaarPayload(data: string, janAadhaarPublicKeyPem = requireEnv('JAN_AADHAAR_PUBLIC_KEY')): string {
  const aesKey = randomBytes(32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(AES_ALGORITHM, aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(data, 'utf8')), cipher.final()]);
  const encryptedAesKey = publicEncrypt({ key: createPublicKey(decodeKey(janAadhaarPublicKeyPem)), ...RSA_PADDING }, aesKey);
  return [iv.toString('base64'), encrypted.toString('base64'), encryptedAesKey.toString('base64')].join(':');
}

export function decryptJanAadhaarPayload(encryptedData: string, privateKeyPem = requireEnv('JAN_AADHAAR_ENCRYPTION_PRIVATE_KEY')): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) throw new Error('JAN_AADHAAR_ENCRYPTED_PAYLOAD_INVALID');
  const [ivBase64, encryptedDataBase64, encryptedAesKeyBase64] = parts;
  const aesKey = privateDecrypt({ key: createPrivateKey(decodeKey(privateKeyPem)), ...RSA_PADDING }, Buffer.from(encryptedAesKeyBase64, 'base64'));
  const decipher = createDecipheriv(AES_ALGORITHM, aesKey, Buffer.from(ivBase64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedDataBase64, 'base64')), decipher.final()]).toString('utf8');
}

export function verifyJanAadhaarSignature(data: string, signatureBase64: string, publicKeyPem = requireEnv('JAN_AADHAAR_RESPONSE_PUBLIC_KEY')): boolean {
  const verifier = createSign('RSA-SHA256');
  verifier.update(data, 'utf8');
  verifier.end();
  return verifier.verify(createPublicKey(decodeKey(publicKeyPem)), Buffer.from(signatureBase64, 'base64'));
}

export function janAadhaarCertificateFingerprint(publicKeyPem = requireEnv('JAN_AADHAAR_PUBLIC_KEY')): string {
  const { createHash } = require('node:crypto');
  const key = createPublicKey(decodeKey(publicKeyPem)).export({ type: 'spki', format: 'der' });
  return createHash('sha256').update(key).digest('hex').toUpperCase();
}

export type JanAadhaarSignedPayload = { data: Record<string, unknown>; signature: string };

export function buildSignedJanAadhaarPayload(data: Record<string, unknown>, privateKeyPem?: string): JanAadhaarSignedPayload {
  const canonical = JSON.stringify({ data });
  return { data, signature: signJanAadhaarPayload(canonical, privateKeyPem) };
}

export function encryptSignedJanAadhaarPayload(payload: JanAadhaarSignedPayload, publicKeyPem?: string): { data: string } {
  return { data: encryptJanAadhaarPayload(JSON.stringify(payload), publicKeyPem) };
}
