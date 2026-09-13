import { NextRequest, NextResponse } from 'next/server';
import { requireFamilyOwner } from '@/app/lib/ycm-authorization';
import { createFamilyCase, createFamilyConsent, getFamilyResources } from '@/app/lib/family-resources';

export const runtime = 'nodejs';

function familyScope(request: NextRequest) {
  const familyId = request.nextUrl.searchParams.get('familyId');
  if (!familyId) return { familyId: null, response: NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 }) };
  const auth = requireFamilyOwner(request, familyId);
  if (auth.response) return { familyId: null, response: auth.response };
  return { familyId, response: null };
}

export async function GET(request: NextRequest) {
  const scope = familyScope(request);
  if (scope.response) return scope.response;
  try {
    const resources = await getFamilyResources(scope.familyId!);
    return NextResponse.json({ success: true, familyId: scope.familyId, resources }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Family resources read failed', error);
    return NextResponse.json({ success: false, code: 'FAMILY_RESOURCES_UNAVAILABLE' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const scope = familyScope(request);
  if (scope.response) return scope.response;
  try {
    const body = await request.json();
    const resource = body?.resource;
    if (resource === 'case') {
      if (typeof body.categoryId !== 'string' || typeof body.categoryName !== 'string') return NextResponse.json({ success: false, code: 'CASE_CATEGORY_REQUIRED' }, { status: 400 });
      const result = await createFamilyCase({ familyId: scope.familyId!, memberId: typeof body.memberId === 'string' ? body.memberId : null, categoryId: body.categoryId, categoryName: body.categoryName, subService: typeof body.subService === 'string' ? body.subService : null });
      return NextResponse.json({ success: true, case: result }, { status: 201 });
    }
    if (resource === 'consent') {
      if (typeof body.consentType !== 'string' || typeof body.policyVersion !== 'string' || typeof body.granted !== 'boolean') return NextResponse.json({ success: false, code: 'CONSENT_FIELDS_REQUIRED' }, { status: 400 });
      const result = await createFamilyConsent({ familyId: scope.familyId!, memberId: typeof body.memberId === 'string' ? body.memberId : null, consentType: body.consentType, granted: body.granted, policyVersion: body.policyVersion });
      return NextResponse.json({ success: true, consent: result }, { status: 201 });
    }
    return NextResponse.json({ success: false, code: 'UNSUPPORTED_RESOURCE' }, { status: 400 });
  } catch (error) {
    console.error('Family resource write failed', error);
    return NextResponse.json({ success: false, code: 'FAMILY_RESOURCE_WRITE_FAILED' }, { status: 503 });
  }
}
