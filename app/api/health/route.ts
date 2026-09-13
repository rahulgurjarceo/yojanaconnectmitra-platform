import { NextResponse } from 'next/server';
import { getPostgresCustomerFamilyRepository } from '../../../lib/customer-family-postgres';
import { getPostgresYcmSessionRevocationStore } from '../../../lib/ycm-postgres-session-revocation';
import { getPostgresYcmAuditStore } from '../../../lib/ycm-postgres-audit-store';
import { getCustomerFamilyOtpProvider } from '../../../lib/customer-family-otp';

export const runtime = 'nodejs';

export async function GET() {
  const database = getPostgresCustomerFamilyRepository() !== null;
  const otp = getCustomerFamilyOtpProvider() !== null;
  const sessionRevocation = getPostgresYcmSessionRevocationStore() !== null;
  const securityAudit = getPostgresYcmAuditStore() !== null;
  const production = process.env.NODE_ENV === 'production';
  const securityReady = database && sessionRevocation && securityAudit && otp && Boolean(process.env.YCM_SESSION_SECRET);

  return NextResponse.json({
    status: 'ok',
    service: 'Yojana Connect Mitra Platform',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    production: {
      database: database ? 'configured' : 'pending',
      authentication: otp && Boolean(process.env.YCM_SESSION_SECRET) ? 'configured' : 'pending',
      session_revocation: sessionRevocation ? 'configured' : 'pending',
      security_audit: securityAudit ? 'configured' : 'pending',
      payments: 'pending',
      verified_data_sources: 'pending',
      security_ready: production ? securityReady : false,
    },
  });
}
