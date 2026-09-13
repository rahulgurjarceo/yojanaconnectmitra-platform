import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName } from '../../../../lib/ycm-access-control';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, loggedOut: true });
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
