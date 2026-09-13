import { NextRequest, NextResponse } from 'next/server';
import { requireFamilyOwner } from '../../../lib/ycm-authorization';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const familyId = request.nextUrl.searchParams.get('familyId');
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });

  const auth = requireFamilyOwner(request, familyId);
  if (auth.response) return auth.response;

  return NextResponse.json({
    success: true,
    family: {
      familyId,
      subject: auth.session!.sub,
      scope: 'family:self',
      modules: ['members', 'consent', 'documents', 'cases', 'tracking', 'outcomes', 'cri-csat'],
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
