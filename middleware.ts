import { NextRequest, NextResponse } from 'next/server';
import { isProtectedPath, roleCanAccessPath, sessionCookieName, verifySession } from './app/lib/ycm-access-control';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (!roleCanAccessPath(session.role, pathname)) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, code: 'FORBIDDEN_ROLE_SCOPE' }, { status: 403 });
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/ceo/:path*', '/management/:path*', '/employee/:path*', '/crm/:path*', '/family-dashboard/:path*', '/command-center/:path*', '/api/ceo/:path*', '/api/management/:path*', '/api/employee/:path*', '/api/crm/:path*', '/api/family-dashboard/:path*', '/api/command-center/:path*'],
};
