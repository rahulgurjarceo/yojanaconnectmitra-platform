import { NextRequest, NextResponse } from 'next/server';
import { roleHasPermission, type YcmSession, verifySession, sessionCookieName } from './ycm-access-control';

export function getAuthenticatedSession(request: NextRequest): YcmSession | null {
  return verifySession(request.cookies.get(sessionCookieName())?.value);
}

export function requirePermission(request: NextRequest, permission: string) {
  const session = getAuthenticatedSession(request);
  if (!session) return { session: null, response: NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 }) };
  if (!roleHasPermission(session.role, permission)) return { session: null, response: NextResponse.json({ success: false, code: 'FORBIDDEN_PERMISSION' }, { status: 403 }) };
  return { session, response: null };
}

export function requireFamilyOwner(request: NextRequest, familyId: string) {
  const result = requirePermission(request, 'family:self');
  if (result.response) return result;
  if (!result.session?.familyId || result.session.familyId !== familyId) {
    return { session: null, response: NextResponse.json({ success: false, code: 'FORBIDDEN_RESOURCE_SCOPE' }, { status: 403 }) };
  }
  return result;
}

export function requireEmployeeScope(request: NextRequest, employeeId: string) {
  const session = getAuthenticatedSession(request);
  if (!session) return { session: null, response: NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 }) };
  if (session.role === 'employee' && session.employeeId !== employeeId) {
    return { session: null, response: NextResponse.json({ success: false, code: 'FORBIDDEN_RESOURCE_SCOPE' }, { status: 403 }) };
  }
  if (!roleHasPermission(session.role, 'case:assigned') && !['management', 'ceo', 'admin'].includes(session.role)) {
    return { session: null, response: NextResponse.json({ success: false, code: 'FORBIDDEN_PERMISSION' }, { status: 403 }) };
  }
  return { session, response: null };
}
