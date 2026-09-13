import { createHmac, timingSafeEqual } from 'node:crypto';

export const YCM_ROLES = ['family', 'employee', 'management', 'ceo', 'admin', 'partner', 'referral'] as const;
export type YcmRole = (typeof YCM_ROLES)[number];

export type YcmSession = {
  sub: string;
  role: YcmRole;
  familyId?: string;
  employeeId?: string;
  permissions: string[];
  iat: number;
  exp: number;
  sessionId: string;
};

const COOKIE = 'ycm_session';
const secret = () => process.env.YCM_SESSION_SECRET || '';

function encode(value: string) { return Buffer.from(value).toString('base64url'); }
function decode(value: string) { return Buffer.from(value, 'base64url').toString('utf8'); }

export function sessionCookieName() { return COOKIE; }

export function signSession(session: YcmSession): string {
  if (!secret()) throw new Error('YCM_SESSION_SECRET_NOT_CONFIGURED');
  const payload = encode(JSON.stringify(session));
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySession(token: string | undefined): YcmSession | null {
  if (!token || !secret()) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(decode(payload)) as YcmSession;
    if (!session.sub || !YCM_ROLES.includes(session.role) || !session.sessionId) return null;
    if (!Number.isFinite(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch { return null; }
}

const ROLE_PERMISSIONS: Record<YcmRole, readonly string[]> = {
  family: ['family:self', 'case:self', 'document:self', 'consent:self', 'cri:self'],
  employee: ['case:assigned', 'customer:assigned', 'document:assigned', 'cri:assigned'],
  management: ['case:all', 'customer:all', 'crm:all', 'reports:all', 'cri:all'],
  ceo: ['case:all', 'customer:all', 'crm:all', 'reports:all', 'finance:all', 'hr:all', 'security:all', 'cri:all', 'management:all'],
  admin: ['platform:all', 'security:all', 'user:all'],
  partner: ['case:partner', 'customer:partner'],
  referral: ['case:referral'],
};

export function roleHasPermission(role: YcmRole, permission: string) {
  return ROLE_PERMISSIONS[role].includes(permission) || ROLE_PERMISSIONS[role].includes('platform:all');
}

export function roleCanAccessPath(role: YcmRole, pathname: string) {
  if (pathname.startsWith('/ceo') || pathname.startsWith('/api/ceo')) return role === 'ceo';
  if (pathname.startsWith('/management') || pathname.startsWith('/api/management')) return ['management', 'ceo', 'admin'].includes(role);
  if (pathname.startsWith('/employee') || pathname.startsWith('/api/employee')) return ['employee', 'management', 'ceo', 'admin'].includes(role);
  if (pathname.startsWith('/crm') || pathname.startsWith('/api/crm')) return ['employee', 'management', 'ceo', 'admin', 'partner', 'referral'].includes(role);
  if (pathname.startsWith('/family-dashboard') || pathname.startsWith('/api/family-dashboard')) return role === 'family';
  if (pathname.startsWith('/api/command-center') || pathname.startsWith('/command-center')) return ['ceo', 'management', 'admin'].includes(role);
  return true;
}

export function isProtectedPath(pathname: string) {
  return ['/ceo', '/management', '/employee', '/crm', '/family-dashboard', '/command-center', '/api/ceo', '/api/management', '/api/employee', '/api/crm', '/api/family-dashboard', '/api/command-center'].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
