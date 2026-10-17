import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
import { getYcmIntegrationStatus } from '../../../lib/ycm-integration-registry';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  if (!['ceo', 'admin', 'management'].includes(session.role)) {
    return NextResponse.json({ success: false, code: 'FORBIDDEN_ROLE_SCOPE' }, { status: 403 });
  }

  const integrations = getYcmIntegrationStatus();
  const byTier = integrations.reduce<Record<string, { total: number; configured: number; missing: number }>>((acc, item) => {
    acc[item.tier] ??= { total: 0, configured: 0, missing: 0 };
    acc[item.tier].total += 1;
    if (item.configured) acc[item.tier].configured += 1;
    else acc[item.tier].missing += 1;
    return acc;
  }, {});

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    summary: {
      total: integrations.length,
      configured: integrations.filter((item) => item.configured).length,
      missing: integrations.filter((item) => !item.configured).length,
    },
    byTier,
    integrations,
    security: 'Configuration status only; credentials and secret values are never returned.',
  });
}
