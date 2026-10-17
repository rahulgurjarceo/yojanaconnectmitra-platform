import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';

export const runtime = 'nodejs';

function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10 }) : null;
}

export async function GET(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(sessionCookieName() + '='))?.slice(sessionCookieName().length + 1);
  const session = verifySession(token);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });

  const url = new URL(request.url);
  const familyId = url.searchParams.get('familyId');
  const serviceCode = url.searchParams.get('serviceCode');
  if (!familyId || !serviceCode) return NextResponse.json({ success: false, code: 'FAMILY_ID_AND_SERVICE_CODE_REQUIRED' }, { status: 400 });

  // Only platform leadership may inspect an arbitrary family's requirements.
  // Employees/partners/referrals need an explicit assignment contract before cross-family access.
  const managementRoles = ['ceo', 'admin', 'management'];
  if (!managementRoles.includes(session.role) && session.familyId !== familyId) {
    return NextResponse.json({ success: false, code: 'FAMILY_ACCESS_DENIED' }, { status: 403 });
  }

  const dbClient = db();
  if (!dbClient) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    const members = await dbClient`SELECT member_id, full_name, relation, date_of_birth, verified FROM ycm_family_members WHERE family_id = ${familyId} ORDER BY created_at`;
    const statuses = await dbClient`SELECT member_id, service_code, status, reason_code, reason, next_action, due_at, updated_at FROM ycm_family_requirement_status WHERE family_id = ${familyId} AND service_code = ${serviceCode} ORDER BY updated_at DESC`;
    const documents = await dbClient`SELECT document_id, member_id, document_type, ocr_status, validation_status, created_at, updated_at FROM ycm_document_intelligence WHERE family_id = ${familyId} ORDER BY updated_at DESC`;
    const rules = await dbClient`SELECT rule_id, requirement_type, document_type, member_condition, condition, priority, source_name, source_url, source_checked_at FROM ycm_requirement_rules WHERE country = 'IN' AND service_code = ${serviceCode} AND status = 'active' ORDER BY priority ASC`;

    return NextResponse.json({
      success: true,
      familyId,
      serviceCode,
      members,
      requirements: statuses,
      documents,
      rules,
      summary: {
        missing: statuses.filter(x => x.status === 'missing').length,
        required: statuses.filter(x => x.status === 'required').length,
        actionRequired: statuses.filter(x => x.status === 'action_required').length,
        expired: statuses.filter(x => x.status === 'expired').length,
        pendingAuthority: statuses.filter(x => x.status === 'pending_authority').length,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } finally {
    await dbClient.end({ timeout: 2 });
  }
}
