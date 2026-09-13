import { NextRequest, NextResponse } from 'next/server';
import { requireFamilyOwner } from '@/app/lib/ycm-authorization';
import { insertFamilyCase, insertFamilyConsent, readFamilyResources } from '@/app/lib/family-resource-db';

export const runtime = 'nodejs';

function scope(request: NextRequest) {
  const familyId = request.nextUrl.searchParams.get('familyId');
  if (!familyId) return { familyId: null, response: NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 }) };
  const auth = requireFamilyOwner(request, familyId);
  if (auth.response) return { familyId: null, response: auth.response };
  return { familyId, response: null };
}

export async function GET(request: NextRequest) {
  const s = scope(request);
  if (s.response) return s.response;
  try { return NextResponse.json({ success: true, familyId: s.familyId, resources: await readFamilyResources(s.familyId!) }, { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { console.error('Family resources read failed', error); return NextResponse.json({ success: false, code: 'FAMILY_RESOURCES_UNAVAILABLE' }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const s = scope(request);
  if (s.response) return s.response;
  try {
    const body = await request.json();
    if (body?.resource === 'case') {
      if (typeof body.categoryId !== 'string' || typeof body.categoryName !== 'string') return NextResponse.json({ success: false, code: 'CASE_CATEGORY_REQUIRED' }, { status: 400 });
      return NextResponse.json({ success: true, case: await insertFamilyCase({ familyId: s.familyId!, memberId: typeof body.memberId === 'string' ? body.memberId : null, categoryId: body.categoryId, categoryName: body.categoryName, subService: typeof body.subService === 'string' ? body.subService : null }) }, { status: 201 });
    }
    if (body?.resource === 'consent') {
      if (typeof body.consentType !== 'string' || typeof body.policyVersion !== 'string' || typeof body.granted !== 'boolean') return NextResponse.json({ success: false, code: 'CONSENT_FIELDS_REQUIRED' }, { status: 400 });
      return NextResponse.json({ success: true, consent: await insertFamilyConsent({ familyId: s.familyId!, memberId: typeof body.memberId === 'string' ? body.memberId : null, consentType: body.consentType, granted: body.granted, policyVersion: body.policyVersion }) }, { status: 201 });
    }
    return NextResponse.json({ success: false, code: 'UNSUPPORTED_RESOURCE' }, { status: 400 });
  } catch (error) { console.error('Family resource write failed', error); return NextResponse.json({ success: false, code: 'FAMILY_RESOURCE_WRITE_FAILED' }, { status: 503 }); }
}
