import { NextRequest, NextResponse } from 'next/server';
import { isProtectedPath, roleCanAccessPath, sessionCookieName, verifySession } from './app/lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from './app/lib/ycm-postgres-session-revocation';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Revocation is checked server-side for every protected request. If production
  // cannot reach the revocation store, fail closed rather than granting access.
  const revocationStore = getPostgresYcmSessionRevocationStore();
  if (!revocationStore) {
    if (process.env.NODE_ENV === 'production') {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ success: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503 })
        : new NextResponse('Authentication security store unavailable', { status: 503 });
    }
  } else {
    try {
      if (await revocationStore.isRevoked(session.sessionId)) {
        if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, code: 'SESSION_REVOKED' }, { status: 401 });
        const url = new URL('/login', request.url);
        url.searchParams.set('next', pathname);
        url.searchParams.set('reason', 'session_revoked');
        return NextResponse.redirect(url);
      }
    } catch {
      if (process.env.NODE_ENV === 'production') {
        return pathname.startsWith('/api/')
          ? NextResponse.json({ success: false, code: 'AUTH_SECURITY_STORE_UNAVAILABLE' }, { status: 503 })
          : new NextResponse('Authentication security store unavailable', { status: 503 });
      }
    }
  }

  if (!roleCanAccessPath(session.role, pathname)) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, code: 'FORBIDDEN_ROLE_SCOPE' }, { status: 403 });
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-YCM-Auth', 'verified-session');
  return response;
}

export const config = {
  matcher: ['/ceo/:path*', '/management/:path*', '/employee/:path*', '/crm/:path*', '/family-dashboard/:path*', '/command-center/:path*', '/api/ceo/:path*', '/api/management/:path*', '/api/employee/:path*', '/api/crm/:path*', '/api/family-dashboard/:path*', '/api/command-center/:path*'],
};
