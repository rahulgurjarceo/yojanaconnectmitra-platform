import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from '../../../lib/ycm-postgres-session-revocation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  const revocationStore = getPostgresYcmSessionRevocationStore();
  if (!revocationStore && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ authenticated: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (revocationStore) {
    try {
      if (await revocationStore.isRevoked(session.sessionId)) {
        return NextResponse.json({ authenticated: false, code: 'SESSION_REVOKED' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
      }
    } catch {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ authenticated: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
      }
    }
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
