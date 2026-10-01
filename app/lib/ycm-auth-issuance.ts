import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { permissionsForRole, roleHasPermission, sessionCookieName, signSession, type YcmRole } from './ycm-access-control';

export type VerifiedIdentity = {
  subject: string;
  role: YcmRole;
  familyId?: string;
  employeeId?: string;
  authVersion?: number;
};

const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function issueVerifiedSession(identity: VerifiedIdentity) {
  if (identity.role === 'family' && (!identity.familyId || identity.subject !== identity.familyId)) throw new Error('INVALID_FAMILY_IDENTITY');
  if (identity.role === 'employee' && (!identity.employeeId || identity.subject !== identity.employeeId)) throw new Error('INVALID_EMPLOYEE_IDENTITY');

  const now = Math.floor(Date.now() / 1000);
  const permissions = permissionsForRole(identity.role).filter(permission => roleHasPermission(identity.role, permission));

  const token = signSession({
    sub: identity.subject, role: identity.role, familyId: identity.familyId, employeeId: identity.employeeId,
    authVersion: identity.authVersion ?? 1,
    permissions, iat: now, exp: now + SESSION_TTL_SECONDS, sessionId: randomUUID(),
  });

  const response = NextResponse.json({
    success: true, authenticated: true, role: identity.role,
    familyId: identity.familyId ?? null, employeeId: identity.employeeId ?? null,
    expiresAt: new Date((now + SESSION_TTL_SECONDS) * 1000).toISOString(),
  });

  response.cookies.set({
    name: sessionCookieName(), value: token, httpOnly: true,
    secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS,
  });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
