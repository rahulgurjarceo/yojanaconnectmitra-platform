import postgres from 'postgres';
import {createHash} from 'node:crypto';

const client = process.env.DATABASE_URL || process.env.POSTGRES_URL
  ? postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!, {max:3,prepare:false,connect_timeout:10,idle_timeout:20})
  : null;

export async function loginRateLimited(identifier:string, clientKey:string){
  if(!client) throw new Error('DATABASE_NOT_CONFIGURED');
  const key=createHash('sha256').update(identifier.trim().toLowerCase()+'|'+clientKey).digest('hex');
  const rows=await client`INSERT INTO ycm_auth_login_attempts(key_hash,window_started_at,request_count)
    VALUES(${key},NOW(),1)
    ON CONFLICT(key_hash) DO UPDATE SET
      request_count=CASE WHEN ycm_auth_login_attempts.window_started_at < NOW()-INTERVAL '1 minute' THEN 1 ELSE ycm_auth_login_attempts.request_count+1 END,
      window_started_at=CASE WHEN ycm_auth_login_attempts.window_started_at < NOW()-INTERVAL '1 minute' THEN NOW() ELSE ycm_auth_login_attempts.window_started_at END
    RETURNING request_count`;
  return Number(rows[0]?.request_count ?? 99) > 10;
}