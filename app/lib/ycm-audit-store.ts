import type { YcmAuditRecord } from './ycm-audit-events';

/**
 * Persistence boundary for security audit records.
 * Implementations must persist append-only records in production.
 * No request handler should silently treat an audit write failure as success.
 */
export interface YcmAuditStore {
  append(record: YcmAuditRecord): Promise<void>;
}

export async function recordSecurityAudit(store: YcmAuditStore, record: YcmAuditRecord) {
  await store.append(record);
}
