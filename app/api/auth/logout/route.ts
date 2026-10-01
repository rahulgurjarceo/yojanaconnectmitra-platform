import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from '../../../lib/ycm-postgres-session-revocation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  const store = getPostgresYcmSessionRevocationStore();

  if (session && store) {
    try {
      await store.revoke(session.sessionId, session.exp, 'logout');
    } catch {
      // Logout still clears the browser cookie even if the revocation store is temporarily unavailable.
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: sessionCookieName(),
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
