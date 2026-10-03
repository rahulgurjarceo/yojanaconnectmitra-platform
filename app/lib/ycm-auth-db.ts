import postgres from 'postgres';
import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, hashResetToken } from './ycm-password';
import type { YcmRole } from './ycm-access-control';

const sql = process.env.DATABASE_URL || process.env.POSTGRES_URL
  ? postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!, { max: 5, prepare: false, connect_timeout: 10, idle_timeout: 20 })
  : null;

export function authDb() { if (!sql) throw new Error('DATABASE_NOT_CONFIGURED'); return sql; }

export const YCM_LOGIN_IDENTIFIER_TYPES = ['aadhaar','jan_aadhaar','pan','voter_id','ration_card','passport','driving_license'] as const;
export type YcmLoginIdentifierType = (typeof YCM_LOGIN_IDENTIFIER_TYPES)[number];

function normalizeIdentityIdentifier(type:YcmLoginIdentifierType, value:string) {
  const compact=value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if (!compact) throw new Error('IDENTIFIER_REQUIRED');
  if (type === 'aadhaar' && !/^\d{12}$/.test(compact)) throw new Error('AADHAAR_IDENTIFIER_INVALID');
  if (type === 'jan_aadhaar' && !/^\d{8,20}$/.test(compact)) throw new Error('JAN_AADHAAR_IDENTIFIER_INVALID');
  if (type === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]$/.test(compact)) throw new Error('PAN_IDENTIFIER_INVALID');
  if (type === 'ration_card' && compact.length < 6) throw new Error('RATION_CARD_IDENTIFIER_INVALID');
  if (type === 'passport' && !/^[A-Z0-9]{6,12}$/.test(compact)) throw new Error('PASSPORT_IDENTIFIER_INVALID');
  if (type === 'voter_id' && compact.length < 6) throw new Error('VOTER_ID_IDENTIFIER_INVALID');
  if (type === 'driving_license' && compact.length < 8) throw new Error('DRIVING_LICENSE_IDENTIFIER_INVALID');
  return compact;
}

export function hashLoginIdentifier(type:YcmLoginIdentifierType, value:string) {
  return createHash('sha256').update(type+':'+normalizeIdentityIdentifier(type,value)).digest('hex');
}

export function maskLoginIdentifier(type:YcmLoginIdentifierType, value:string) {
  const normalized=normalizeIdentityIdentifier(type,value);
  if (normalized.length <= 4) return '****';
  return normalized.slice(0,2)+'*'.repeat(Math.max(2,normalized.length-4))+normalized.slice(-2);
}

export async function findUser(identifier:string) {
  const value=identifier.trim().toLowerCase();
  const rows=await authDb()`SELECT id,user_id,full_name,email,mobile,password_hash,role,status,auth_version FROM ycm_users WHERE LOWER(user_id)=${value} OR LOWER(email)=${value} OR mobile=${identifier.trim()} LIMIT 1`;
  if (rows[0]) return rows[0];
  const compact=identifier.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if (!compact) return null;
  const hashes=YCM_LOGIN_IDENTIFIER_TYPES.map(type=>createHash('sha256').update(type+':'+compact).digest('hex'));
  const identityRows=await authDb()`SELECT u.id,u.user_id,u.full_name,u.email,u.mobile,u.password_hash,u.role,u.status,u.auth_version
    FROM ycm_login_identifiers i JOIN ycm_users u ON u.id=i.user_id
    WHERE i.identifier_hash=ANY(${hashes}) AND i.verification_status='verified'
    ORDER BY i.verified_at DESC NULLS LAST LIMIT 1`;
  return identityRows[0] ?? null;
}

export async function linkVerifiedLoginIdentifier(input:{userId:string;identifierType:YcmLoginIdentifierType;identifier:string;verificationSource:string}) {
  const db=authDb();
  const hash=hashLoginIdentifier(input.identifierType,input.identifier);
  const masked=maskLoginIdentifier(input.identifierType,input.identifier);
  const user=await db`SELECT id FROM ycm_users WHERE user_id=${input.userId} LIMIT 1`;
  if(!user[0]) throw new Error('USER_NOT_FOUND');
  const rows=await db`INSERT INTO ycm_login_identifiers
    (user_id,identifier_type,identifier_hash,masked_value,verification_status,verification_source,verified_at)
    VALUES (${user[0].id},${input.identifierType},${hash},${masked},'verified',${input.verificationSource},NOW())
    ON CONFLICT(identifier_type,identifier_hash) DO UPDATE SET user_id=EXCLUDED.user_id,masked_value=EXCLUDED.masked_value,verification_status='verified',verification_source=EXCLUDED.verification_source,verified_at=NOW(),updated_at=NOW()
    RETURNING identifier_id,identifier_type,masked_value,verification_status,verified_at`;
  return rows[0];
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


export type YcmMembershipType = 'individual'|'family';
export type YcmMembershipSegment = 'standard'|'defense_family'|'widow_household';

export async function createMembership(input:{userId:string;membershipType:YcmMembershipType;membershipSegment:YcmMembershipSegment}) {
  const db=authDb();
  const isSpecial=input.membershipSegment !== 'standard';
  if(isSpecial && input.membershipType !== 'family') throw new Error('SPECIAL_MEMBERSHIP_REQUIRES_FAMILY');
  const validityYears=1;
  const planCode='YCM_99_1Y';
  const reviewStatus=isSpecial ? 'pending' : 'not_required';
  const rows=await db`INSERT INTO ycm_memberships
    (user_id,membership_type,membership_segment,plan_code,amount_paise,currency,validity_years,status,review_status,review_type)
    VALUES
    (${input.userId},${input.membershipType},${input.membershipSegment},${planCode},9900,'INR',${validityYears},'pending_payment',${reviewStatus},${isSpecial ? input.membershipSegment : null})
    ON CONFLICT (user_id,membership_type) WHERE status='pending_payment'
    DO UPDATE SET
      membership_segment=EXCLUDED.membership_segment,
      plan_code=EXCLUDED.plan_code,
      validity_years=EXCLUDED.validity_years,
      review_status=EXCLUDED.review_status,
      review_type=EXCLUDED.review_type,
      updated_at=NOW()
    RETURNING membership_id,membership_type,membership_segment,plan_code,amount_paise,currency,validity_years,status,review_status,review_type,family_id`;
  return rows[0];
}

export async function getUserPrimaryMembership(userId:string) {
  const rows=await authDb()`SELECT membership_id,membership_type,plan_code,amount_paise,currency,validity_years,status,family_id
    FROM ycm_memberships
    WHERE user_id=(SELECT id FROM ycm_users WHERE user_id=${userId} LIMIT 1)
      AND status IN ('active','pending_payment')
    ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END, created_at DESC
    LIMIT 1`;
  return rows[0] ?? null;
}
