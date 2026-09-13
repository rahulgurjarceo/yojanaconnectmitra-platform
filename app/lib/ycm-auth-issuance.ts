import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { roleHasPermission, sessionCookieName, signSession, type YcmRole } from './ycm-access-control';

export type VerifiedIdentity = {
  subject: string;
  role: YcmRole;
  familyId?: string;
  employeeId?: string;
};

const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function issueVerifiedSession(identity: VerifiedIdentity) {
  const now = Math.floor(Date.now() / 1000);
  const permissions = [
    'family:self','case:self','document:self','consent:self','cri:self',
    'case:assigned','customer:assigned','document:assigned','cri:assigned',
    'case:all','customer:all','crm:all','reports:all','finance:all','hr:all','security:all','cri:all','management:all',
    'platform:all','user:all','case:partner','customer:partner','case:referral'
  ].filter(permission => roleHasPermission(identity.role, permission));

  const token = signSession({
    sub: identity.subject,
    role: identity.role,
    familyId: identity.familyId,
    employeeId: identity.employeeId,
    permissions,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    sessionId: randomUUID(),
  });

  const response = NextResponse.json({
    success: true,
    authenticated: true,
    role: identity.role,
    familyId: identity.familyId ?? null,
    employeeId: identity.employeeId ?? null,
    expiresAt: new Date((now + SESSION_TTL_SECONDS) * 1000).toISOString(),
  });

  response.cookies.set({
    name: sessionCookieName(),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
