import postgres from 'postgres';
import type { YcmSessionRevocationStore } from './ycm-session-revocation';

function getClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
}

export class PostgresYcmSessionRevocationStore implements YcmSessionRevocationStore {
  private readonly sql = getClient();

  async revoke(sessionId: string, expiresAt: number, reason: string): Promise<void> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    await this.sql`INSERT INTO ycm_revoked_sessions (session_id, expires_at, reason) VALUES (${sessionId}, ${new Date(expiresAt * 1000)}, ${reason}) ON CONFLICT (session_id) DO UPDATE SET reason = EXCLUDED.reason`;
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`SELECT 1 FROM ycm_revoked_sessions WHERE session_id = ${sessionId} AND expires_at > NOW() LIMIT 1`;
    return rows.length > 0;
  }
}

let store: PostgresYcmSessionRevocationStore | null | undefined;
export function getPostgresYcmSessionRevocationStore() {
  if (store === undefined) store = getClient() ? new PostgresYcmSessionRevocationStore() : null;
  return store;
}
