import postgres from 'postgres';
import type { YcmAuditRecord } from './ycm-audit-events';
import type { YcmAuditStore } from './ycm-audit-store';

function getClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
}

export class PostgresYcmAuditStore implements YcmAuditStore {
  private readonly sql = getClient();

  async append(record: YcmAuditRecord): Promise<void> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    await this.sql`INSERT INTO ycm_security_audit_events (event, subject, role, session_id, family_id, employee_id, resource_type, resource_id, success, created_at) VALUES (${record.event}, ${record.subject}, ${record.role}, ${record.sessionId || null}, ${record.familyId || null}, ${record.employeeId || null}, ${record.resourceType || null}, ${record.resourceId || null}, ${record.success}, ${record.createdAt})`;
  }
}

let store: PostgresYcmAuditStore | null | undefined;
export function getPostgresYcmAuditStore() {
  if (store === undefined) store = getClient() ? new PostgresYcmAuditStore() : null;
  return store;
}
