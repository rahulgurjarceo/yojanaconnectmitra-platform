import postgres from 'postgres';
import { createHash } from 'node:crypto';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

function getClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 2, prepare: false, connect_timeout: 5, idle_timeout: 20 }) : null;
}

function hashKey(identifier: string, clientKey: string) {
  return createHash('sha256')
    .update(`${identifier.trim().toLowerCase()}|${clientKey.trim()}`)
    .digest('hex');
}

export async function loginRateLimited(identifier: string, clientKey: string): Promise<boolean> {
  const sql = getClient();
  if (!sql) throw new Error('DATABASE_NOT_CONFIGURED');

  const keyHash = hashKey(identifier, clientKey || 'unknown');
  const now = new Date();
  const result = await sql.begin(async (tx) => {
    const rows = await tx`
      INSERT INTO ycm_auth_login_attempts (key_hash, window_started_at, request_count)
      VALUES (${keyHash}, ${now}, 1)
      ON CONFLICT (key_hash) DO UPDATE SET
        request_count = CASE
          WHEN ycm_auth_login_attempts.window_started_at <= ${new Date(now.getTime() - WINDOW_MS)}
            THEN 1
          ELSE ycm_auth_login_attempts.request_count + 1
        END,
        window_started_at = CASE
          WHEN ycm_auth_login_attempts.window_started_at <= ${new Date(now.getTime() - WINDOW_MS)}
            THEN ${now}
          ELSE ycm_auth_login_attempts.window_started_at
        END
      RETURNING request_count
    `;
    return Number(rows[0]?.request_count ?? 1);
  });

  return result > MAX_REQUESTS_PER_WINDOW;
}
