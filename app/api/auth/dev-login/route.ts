import { NextResponse } from 'next/server';
import { issueVerifiedSession } from '../../../lib/ycm-auth-issuance';
import { YCM_ROLES, type YcmRole } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' || process.env.YCM_DEV_LOGIN !== 'true') {
    return NextResponse.json({ success: false, code: 'DEV_LOGIN_DISABLED' }, { status: 404 });
  }
  if (!process.env.YCM_SESSION_SECRET) {
    return NextResponse.json({ success: false, code: 'SESSION_SECRET_NOT_CONFIGURED' }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { role?: string } | null;
  const role = body?.role as YcmRole | undefined;
  if (!role || !YCM_ROLES.includes(role)) {
    return NextResponse.json({ success: false, code: 'ROLE_REQUIRED', roles: YCM_ROLES }, { status: 400 });
  }

  const identity = {
    subject: `dev-${role}`,
    role,
    ...(role === 'family' ? { familyId: 'dev-family-001' } : {}),
    ...(role === 'employee' ? { employeeId: 'dev-employee-001' } : {}),
  } as const;

  return issueVerifiedSession(identity);
}
