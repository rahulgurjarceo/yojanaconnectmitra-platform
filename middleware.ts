import { NextRequest, NextResponse } from 'next/server';
import { isProtectedPath, roleCanAccessPath, sessionCookieName, verifySession } from './app/lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from './app/lib/ycm-postgres-session-revocation';
import { getUserAuthVersion } from './app/lib/ycm-auth-db';

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
      if (session.authVersion !== undefined) {
        const current = await getUserAuthVersion(session.sub);
        if (!current || current.status !== 'active' || Number(current.auth_version) !== Number(session.authVersion)) {
          if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, code: 'SESSION_VERSION_EXPIRED' }, { status: 401 });
          const url = new URL('/login', request.url);
          url.searchParams.set('next', pathname);
          url.searchParams.set('reason', 'session_expired');
          return NextResponse.redirect(url);
        }
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
  matcher: ['/ceo/:path*', '/management/:path*', '/employee/:path*', '/lawyer/:path*', '/farmer/:path*', '/student/:path*', '/crm/:path*', '/family-dashboard/:path*', '/command-center/:path*', '/impact-proof/:path*', '/api/ceo/:path*', '/api/management/:path*', '/api/employee/:path*', '/api/lawyer/:path*', '/api/farmer/:path*', '/api/student/:path*', '/api/crm/:path*', '/api/family-dashboard/:path*', '/api/command-center/:path*', '/api/impact-proof/:path*'],
};
