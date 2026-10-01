import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

type ScryptOptions = { N: number; r: number; p: number };

const PASSWORD_MIN = 12;
const KEYLEN = 64;

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, keylen, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export function assertPasswordPolicy(password: string) {
  if (password.length < PASSWORD_MIN || password.length > 128) throw new Error('PASSWORD_POLICY');
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('PASSWORD_POLICY');
}

export async function hashPassword(password: string) {
  assertPasswordPolicy(password);
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEYLEN, { N: 32768, r: 8, p: 1 });
  return `scrypt$32768$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    const [scheme, n, r, p, saltText, keyText] = stored.split('$');
    if (scheme !== 'scrypt' || !n || !r || !p || !saltText || !keyText) return false;
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(keyText, 'base64url');
    const actual = await scryptAsync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
