import { NextResponse } from 'next/server';
import { calculateCRI, type CriInput } from '../../cri';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';

export const runtime = 'nodejs';

function getSession(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim())
    .find(v => v.startsWith(sessionCookieName() + '='))
    ?.slice(sessionCookieName().length + 1);
  return verifySession(token);
}

export async function POST(request: Request) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  }

  const allowed = ['employee', 'lawyer', 'management', 'ceo', 'admin'].includes(session.role);
  if (!allowed) {
    return NextResponse.json({ success: false, code: 'FORBIDDEN_ROLE_SCOPE' }, { status: 403 });
  }

  try {
    const input = (await request.json()) as CriInput;
    const result = calculateCRI(input);
    return NextResponse.json(
      { success: true, cri: result },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid CRI request' }, { status: 400 });
  }
}
