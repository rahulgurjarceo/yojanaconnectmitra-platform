import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../../lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from '../../../../lib/ycm-postgres-session-revocation';
import { buildAuditRecord } from '../../../../lib/ycm-audit-events';
import { getPostgresYcmAuditStore } from '../../../../lib/ycm-postgres-audit-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  const session = verifySession(token);
  const response = NextResponse.json({ success: true, loggedOut: true });

  if (session) {
    const store = getPostgresYcmSessionRevocationStore();
    const auditStore = getPostgresYcmAuditStore();
    if ((!store || !auditStore) && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
    }
    try {
      if (store) await store.revoke(session.sessionId, session.exp, 'user_logout');
      if (auditStore) {
        await auditStore.append(buildAuditRecord({
          event: 'AUTH_LOGOUT',
          subject: session.sub,
          role: session.role,
          sessionId: session.sessionId,
          familyId: session.familyId,
          employeeId: session.employeeId,
          success: true,
        }));
      }
    } catch {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
      }
    }
  }

  response.cookies.set({
    name: sessionCookieName(),
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
