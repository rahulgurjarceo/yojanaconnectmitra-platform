import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../../lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from '../../../../lib/ycm-postgres-session-revocation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  const session = verifySession(token);
  const response = NextResponse.json({ success: true, loggedOut: true });

  if (session) {
    const store = getPostgresYcmSessionRevocationStore();
    if (!store && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (store) {
      try {
        await store.revoke(session.sessionId, session.exp, 'user_logout');
      } catch {
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ success: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
        }
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
