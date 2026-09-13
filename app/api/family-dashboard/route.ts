import { NextRequest, NextResponse } from 'next/server';
import { requireFamilyOwner } from '../../../lib/ycm-authorization';
import { getPostgresCustomerFamilyRepository } from '../../../lib/customer-family-postgres';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const familyId = request.nextUrl.searchParams.get('familyId');
    if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });

    const auth = await requireFamilyOwner(request, familyId);
    if (auth.response) return auth.response;

    const repository = getPostgresCustomerFamilyRepository();
    if (!repository) return NextResponse.json({ success: false, code: 'FAMILY_DATABASE_NOT_CONFIGURED' }, { status: 503 });

    const family = await repository.getFamily(familyId);
    if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });

    return NextResponse.json({
      success: true,
      family: {
        familyId: family.familyId,
        status: family.status,
        primaryMobile: family.primaryMobile,
        createdAt: family.createdAt,
        members: family.members,
        scope: 'family:self',
        modules: ['members', 'consent-ledger', 'document-vault', 'cases', 'tracking', 'outcomes', 'cri-csat'],
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Family dashboard read failed', error);
    return NextResponse.json({ success: false, code: 'FAMILY_DASHBOARD_UNAVAILABLE' }, { status: 503 });
  }
}
