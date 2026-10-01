import postgres from 'postgres';
import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, hashResetToken } from './ycm-password';
import type { YcmRole } from './ycm-access-control';

const sql = process.env.DATABASE_URL || process.env.POSTGRES_URL
  ? postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!, { max: 5, prepare: false, connect_timeout: 10, idle_timeout: 20 })
  : null;

export function authDb() { if (!sql) throw new Error('DATABASE_NOT_CONFIGURED'); return sql; }

export async function findUser(identifier:string) {
  const value=identifier.trim().toLowerCase();
  const rows=await authDb()`SELECT id,user_id,full_name,email,mobile,password_hash,role,status,auth_version FROM ycm_users WHERE LOWER(user_id)=${value} OR LOWER(email)=${value} OR mobile=${identifier.trim()} LIMIT 1`;
  return rows[0] ?? null;
}

export async function getUserAuthVersion(userId:string) {
  const rows=await authDb()`SELECT auth_version,status FROM ycm_users WHERE user_id=${userId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function createUser(input:{fullName:string;email:string;mobile?:string;password:string;role:YcmRole}) {
  const db=authDb(); const normalizedEmail=input.email.trim().toLowerCase(); const mobile=input.mobile?.trim()||null;
  const userId=`YCM-${randomBytes(5).toString('hex').toUpperCase()}`;
  const passwordHash=await hashPassword(input.password);
  const rows=await db`INSERT INTO ycm_users (user_id,full_name,email,mobile,password_hash,role) VALUES (${userId},${input.fullName.trim()},${normalizedEmail},${mobile},${passwordHash},${input.role}) RETURNING id,user_id,full_name,email,mobile,role,status,auth_version`;
  return rows[0];
}

export async function isPasswordResetRateLimited(identifier:string) {
  const db=authDb();
  const key= createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
  const rows=await db`INSERT INTO ycm_password_reset_attempts (key_hash,window_started_at,request_count)
    VALUES (${key},NOW(),1)
    ON CONFLICT (key_hash) DO UPDATE SET
      request_count=CASE WHEN ycm_password_reset_attempts.window_started_at < NOW()-INTERVAL '1 hour' THEN 1 ELSE ycm_password_reset_attempts.request_count+1 END,
      window_started_at=CASE WHEN ycm_password_reset_attempts.window_started_at < NOW()-INTERVAL '1 hour' THEN NOW() ELSE ycm_password_reset_attempts.window_started_at END
    RETURNING request_count`;
  return Number(rows[0]?.request_count ?? 99) > 5;
}

export async function createResetToken(userId:string) {
  const db=authDb(); await db`DELETE FROM ycm_password_reset_tokens WHERE user_id=${userId} OR expires_at < NOW()`;
  const raw=randomBytes(32).toString('base64url'); const hash=hashResetToken(raw);
  await db`INSERT INTO ycm_password_reset_tokens (user_id,token_hash,expires_at) VALUES (${userId},${hash},NOW()+INTERVAL '30 minutes')`;
  return raw;
}

export async function resetPassword(rawToken:string,newPassword:string) {
  const db=authDb(); const hash=hashResetToken(rawToken);
  const rows=await db`SELECT t.id,t.user_id FROM ycm_password_reset_tokens t WHERE t.token_hash=${hash} AND t.used_at IS NULL AND t.expires_at>NOW() LIMIT 1`;
  const token=rows[0]; if(!token) throw new Error('RESET_TOKEN_INVALID');
  const passwordHash=await hashPassword(newPassword);
  await db.begin(async tx=>{
    await tx`UPDATE ycm_users SET password_hash=${passwordHash},auth_version=auth_version+1,updated_at=NOW() WHERE id=${token.user_id}`;
    await tx`UPDATE ycm_password_reset_tokens SET used_at=NOW() WHERE id=${token.id}`;
  });
  return token.user_id as string;
}
