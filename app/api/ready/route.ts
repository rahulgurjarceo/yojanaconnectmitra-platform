import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getCustomerFamilyOtpProvider } from '../../lib/customer-family-otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Readiness is stricter than liveness: only return 200 when core production
 * dependencies are configured, required security tables exist, and PostgreSQL
 * accepts a real query. Never expose connection strings or raw DB errors.
 */
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const sessionSecret = process.env.YCM_SESSION_SECRET || '';
  const checks: Record<string, 'ready' | 'not_ready'> = {
    database: 'not_ready',
    session_secret: sessionSecret.length >= 32 ? 'ready' : 'not_ready',
    otp_provider: getCustomerFamilyOtpProvider() ? 'ready' : 'not_ready',
    session_revocation: 'not_ready',
    security_audit: 'not_ready',
  };

  let sql: ReturnType<typeof postgres> | undefined;
  if (databaseUrl) {
    try {
      sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 3, idle_timeout: 1 });
      const rows = await sql`SELECT 1 AS connected,
        to_regclass('public.ycm_revoked_sessions') IS NOT NULL AS session_revocation,
        to_regclass('public.ycm_security_audit_events') IS NOT NULL AS security_audit`;
      checks.database = rows[0]?.connected === 1 ? 'ready' : 'not_ready';
      checks.session_revocation = rows[0]?.session_revocation === true ? 'ready' : 'not_ready';
      checks.security_audit = rows[0]?.security_audit === true ? 'ready' : 'not_ready';
    } catch {
      checks.database = 'not_ready';
      checks.session_revocation = 'not_ready';
      checks.security_audit = 'not_ready';
    } finally {
      if (sql) {
        try { await sql.end({ timeout: 2 }); } catch { /* readiness must not expose driver errors */ }
      }
    }
  }

  const ready = Object.values(checks).every(value => value === 'ready');
  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      service: 'Yojana Connect Mitra Platform',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  );
}
