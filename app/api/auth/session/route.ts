import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

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
