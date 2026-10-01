import { NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';
import { getYcmIntegrationStatus } from '../../lib/ycm-integration-registry';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(sessionCookieName() + '='))?.slice(sessionCookieName().length + 1);
  const session = verifySession(token);

  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  if (!['ceo', 'admin', 'management'].includes(session.role)) {
    return NextResponse.json({ success: false, code: 'FORBIDDEN_ROLE_SCOPE' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    integrations: getYcmIntegrationStatus(),
    security: 'Credentials are never returned by this endpoint.',
  });
}
