import { NextResponse } from 'next/server';
import { YCM_LIFECYCLE, YCM_MODULES } from '../../ycm-architecture';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(sessionCookieName() + '='))?.slice(sessionCookieName().length + 1);
  const session = verifySession(token);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  if (!['ceo', 'admin', 'management'].includes(session.role)) {
    return NextResponse.json({ success: false, code: 'FORBIDDEN_ROLE_SCOPE' }, { status: 403 });
  }

  const counts = {
    total: YCM_MODULES.length,
    foundation: YCM_MODULES.filter(m => m.status === 'foundation').length,
    partial: YCM_MODULES.filter(m => m.status === 'partial').length,
    planned: YCM_MODULES.filter(m => m.status === 'planned').length,
  };

  return NextResponse.json({
    success: true,
    product: 'YCM ONE',
    counts,
    lifecycle: YCM_LIFECYCLE,
    modules: YCM_MODULES,
    operations: ['AI Mitra', 'Door-to-Door', 'Camps'],
  });
}
