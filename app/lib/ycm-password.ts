import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const PASSWORD_MIN = 12;
const KEYLEN = 64;

export function assertPasswordPolicy(password: string) {
  if (password.length < PASSWORD_MIN || password.length > 128) throw new Error('PASSWORD_POLICY');
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('PASSWORD_POLICY');
}

export async function hashPassword(password: string) {
  assertPasswordPolicy(password);
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N: 32768, r: 8, p: 1 }) as Buffer;
  return `scrypt$32768$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    const [scheme,n,r,p,saltText,keyText] = stored.split('$');
    if (scheme !== 'scrypt' || !n || !r || !p || !saltText || !keyText) return false;
    const salt=Buffer.from(saltText,'base64url'); const expected=Buffer.from(keyText,'base64url');
    const actual=await scrypt(password,salt,expected.length,{N:Number(n),r:Number(r),p:Number(p)}) as Buffer;
    return actual.length===expected.length && timingSafeEqual(actual,expected);
  } catch { return false; }
}

export function hashResetToken(token:string) {
  return createHash('sha256').update(token).digest('hex');
}
