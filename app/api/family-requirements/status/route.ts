import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { requireFamilyOwner } from '../../../lib/ycm-authorization';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const familyId = request.nextUrl.searchParams.get('familyId');
  const serviceCode = request.nextUrl.searchParams.get('serviceCode');
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });
  const auth = requireFamilyOwner(request, familyId);
  if (auth.response) return auth.response;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  const sql = postgres(url, { max: 2, prepare: false, connect_timeout: 10, idle_timeout: 10 });
  try {
    const rows = await sql`
      SELECT r.requirement_status_id, r.member_id, r.service_code, r.status, r.reason_code,
             r.reason, r.next_action, r.due_at, r.updated_at,
             m.full_name AS member_name
      FROM ycm_family_requirement_status r
      LEFT JOIN ycm_family_members m ON m.member_id = r.member_id
      WHERE r.family_id = ${familyId}
        AND (${serviceCode} IS NULL OR r.service_code = ${serviceCode})
      ORDER BY CASE r.status
        WHEN 'action_required' THEN 1 WHEN 'missing' THEN 2 WHEN 're_kyc' THEN 3
        WHEN 'expired' THEN 4 WHEN 'required' THEN 5 WHEN 'pending_authority' THEN 6
        WHEN 'submitted' THEN 7 WHEN 'verified' THEN 8 ELSE 9 END, r.updated_at DESC
      LIMIT 500
    `;
    return NextResponse.json({
      success: true,
      familyId,
      serviceCode: serviceCode || null,
      requirements: rows,
      summary: {
        actionRequired: rows.filter(r => r.status === 'action_required').length,
        missing: rows.filter(r => r.status === 'missing').length,
        reKyc: rows.filter(r => r.status === 're_kyc').length,
        expired: rows.filter(r => r.status === 'expired').length,
        required: rows.filter(r => r.status === 'required').length,
        verified: rows.filter(r => r.status === 'verified').length
      }
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Family requirement status read failed', error);
    return NextResponse.json({ success: false, code: 'REQUIREMENT_STATUS_UNAVAILABLE' }, { status: 503 });
  } finally {
    await sql.end({ timeout: 2 });
  }
}
