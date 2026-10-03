import postgres from 'postgres';
import { getPostgresYcmSessionRevocationStore } from '../../lib/ycm-postgres-session-revocation';
import { getPostgresYcmAuditStore } from '../../lib/ycm-postgres-audit-store';
import { getCustomerFamilyOtpProvider } from '../../lib/customer-family-otp';

export const runtime = 'nodejs';

export async function GET() {
  const database = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const otp = getCustomerFamilyOtpProvider() !== null;
  const sessionRevocation = getPostgresYcmSessionRevocationStore() !== null;
  const securityAudit = getPostgresYcmAuditStore() !== null;
  const production = process.env.NODE_ENV === 'production';
  const securityReady = database && sessionRevocation && securityAudit && otp && Boolean(process.env.YCM_SESSION_SECRET);
  let databaseReachable = false;
  if (database) {
    const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!, { max: 1, prepare: false, connect_timeout: 3, idle_timeout: 5 });
    try { await sql.unsafe('SELECT 1'); databaseReachable = true; }
    catch {}
    finally { await sql.end({ timeout: 2 }); }
  }
  return Response.json({
    status: databaseReachable || !database ? 'ok' : 'degraded',
    service: 'Yojana Connect Mitra Platform',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    production: {
      database: databaseReachable ? 'healthy' : database ? 'configured_unreachable' : 'pending',
      authentication: otp && Boolean(process.env.YCM_SESSION_SECRET) ? 'configured' : 'pending',
      session_revocation: sessionRevocation ? 'configured' : 'pending',
      security_audit: securityAudit ? 'configured' : 'pending',
      payments: 'pending',
      verified_data_sources: 'pending',
      security_ready: production ? securityReady : false,
    },
  });
}
