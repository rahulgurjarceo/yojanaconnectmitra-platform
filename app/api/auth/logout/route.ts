import { NextResponse } from 'next/server';
import { sessionCookieName } from '../../../lib/ycm-access-control';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: sessionCookieName(), value: '', httpOnly: true, expires: new Date(0), path: '/' });
  return response;
}
