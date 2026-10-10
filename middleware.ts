import { NextRequest, NextResponse } from 'next/server';
import { isProtectedPath, roleCanAccessPath, sessionCookieName, verifySession } from './app/lib/ycm-access-control';
import { getPostgresYcmSessionRevocationStore } from './app/lib/ycm-postgres-session-revocation';
import { getUserAuthVersion } from './app/lib/ycm-auth-db';
import { enforceApiRequestPolicy } from './app/lib/ycm-api-request-policy';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestPolicy = enforceApiRequestPolicy(request);
  if (requestPolicy) return requestPolicy;
  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self), payment=()');
    response.headers.set('Content-Security-Policy', "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    return response;
  };

  if (!isProtectedPath(pathname)) return applySecurityHeaders(NextResponse.next());

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

  const response = applySecurityHeaders(NextResponse.next());
  response.headers.set('X-YCM-Auth', 'verified-session');
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/ceo/:path*', '/management/:path*', '/employee/:path*', '/lawyer/:path*', '/farmer/:path*', '/student/:path*', '/crm/:path*', '/family-dashboard/:path*', '/command-center/:path*', '/impact-proof/:path*', '/api/ceo/:path*', '/api/management/:path*', '/api/employee/:path*', '/api/lawyer/:path*', '/api/farmer/:path*', '/api/student/:path*', '/api/crm/:path*', '/api/family-dashboard/:path*', '/api/command-center/:path*', '/api/impact-proof/:path*'],
};
