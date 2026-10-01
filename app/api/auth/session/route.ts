import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from '../../../lib/ycm-postgres-session-revocation';
import { getUserAuthVersion } from '../../../lib/ycm-auth-db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  const revocationStore = getPostgresYcmSessionRevocationStore();
  if (!revocationStore) {
    return NextResponse.json({ authenticated: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
  try {
    if (await revocationStore.isRevoked(session.sessionId)) {
      return NextResponse.json({ authenticated: false, code: 'SESSION_REVOKED' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (session.role === 'family') {
      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!dbUrl || !session.familyId || session.sub !== session.familyId) {
        return NextResponse.json({ authenticated: false, code: 'FAMILY_AUTH_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
      }
      const { default: postgres } = await import('postgres');
      const sql = postgres(dbUrl, { max: 2, prepare: false, connect_timeout: 10, idle_timeout: 10 });
      try {
        const rows = await sql`
          SELECT f.family_id
          FROM ycm_families f
          JOIN ycm_family_user_access a ON a.family_id = f.family_id AND a.user_id = ${session.sub}
          WHERE f.family_id = ${session.familyId}
            AND a.access_role = 'owner'
            AND a.status = 'active'
            AND f.status NOT IN ('expired', 'suspended')
          LIMIT 1
        `;
        if (!rows.length) {
          return NextResponse.json({ authenticated: false, code: 'FAMILY_ACCESS_REVOKED' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
        }
      } finally {
        await sql.end({ timeout: 2 });
      }
    } else if (session.authVersion !== undefined) {
      const current = await getUserAuthVersion(session.sub);
      if (!current || current.status !== 'active' || Number(current.auth_version) !== Number(session.authVersion)) {
        return NextResponse.json({ authenticated: false, code: 'SESSION_VERSION_EXPIRED' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
      }
    }
  } catch {
    return NextResponse.json({ authenticated: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      subject: session.sub,
      role: session.role,
      familyId: session.familyId ?? null,
      employeeId: session.employeeId ?? null,
      permissions: session.permissions,
      expiresAt: new Date(session.exp * 1000).toISOString(),
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
