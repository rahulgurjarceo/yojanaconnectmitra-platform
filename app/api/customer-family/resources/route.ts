import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getPostgresCustomerFamilyRepository } from '../../../lib/customer-family-postgres';
import { requireFamilyOwner } from '../../../lib/ycm-authorization';

export const runtime = 'nodejs';

const relations = new Set(['primary','spouse','child','parent','other']);

export async function POST(request: NextRequest) {
  const repository = getPostgresCustomerFamilyRepository();
  if (!repository) return NextResponse.json({ success:false, code:'DATABASE_NOT_CONFIGURED' }, { status:503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const familyId = typeof body?.familyId === 'string' ? body.familyId.trim() : '';
  const action = typeof body?.action === 'string' ? body.action : '';
  if (!familyId || !action) return NextResponse.json({ success:false, code:'FAMILY_ID_AND_ACTION_REQUIRED' }, { status:400 });
  const access = await requireFamilyOwner(request, familyId);
  if (access.response) return access.response;
  const family = await repository.findById(familyId);
  if (!family) return NextResponse.json({ success:false, code:'FAMILY_NOT_FOUND' }, { status:404 });
  if (family.status !== 'active') return NextResponse.json({ success:false, code:'FAMILY_NOT_ACTIVE' }, { status:409 });

  try {
    if (action === 'member') {
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      const relation = typeof body.relation === 'string' ? body.relation : '';
      if (fullName.length < 2 || !relations.has(relation)) return NextResponse.json({success:false,code:'MEMBER_VALIDATION_ERROR'},{status:400});
      await repository.createMember({ memberId: randomUUID(), familyId, fullName, relation, mobile: typeof body.mobile === 'string' ? body.mobile.trim() : undefined, email: typeof body.email === 'string' ? body.email.trim() : undefined, dateOfBirth: typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined });
      return NextResponse.json({success:true,status:'member_created',familyId},{status:201});
    }
    if (action === 'consent') {
      const consentType = typeof body.consentType === 'string' ? body.consentType.trim() : '';
      const policyVersion = typeof body.policyVersion === 'string' ? body.policyVersion.trim() : '';
      if (!consentType || !policyVersion) return NextResponse.json({success:false,code:'CONSENT_VALIDATION_ERROR'},{status:400});
      await repository.createConsent({ consentId: randomUUID(), familyId, memberId: typeof body.memberId === 'string' ? body.memberId : undefined, consentType, granted: body.granted === true, policyVersion });
      return NextResponse.json({success:true,status:'consent_recorded',familyId},{status:201});
    }
    if (action === 'document') {
      const documentType = typeof body.documentType === 'string' ? body.documentType.trim() : '';
      if (!documentType) return NextResponse.json({success:false,code:'DOCUMENT_TYPE_REQUIRED'},{status:400});
      await repository.createDocument({ documentId: randomUUID(), familyId, memberId: typeof body.memberId === 'string' ? body.memberId : undefined, documentType, storageRef: typeof body.storageRef === 'string' ? body.storageRef.trim() : undefined });
      return NextResponse.json({success:true,status:'document_registered',familyId},{status:201});
    }
    if (action === 'case') {
      const caseCategoryId = typeof body.caseCategoryId === 'string' ? body.caseCategoryId.trim() : '';
      const caseCategoryName = typeof body.caseCategoryName === 'string' ? body.caseCategoryName.trim() : '';
      if (!caseCategoryId || !caseCategoryName) return NextResponse.json({success:false,code:'CASE_VALIDATION_ERROR'},{status:400});
      await repository.createCase({ caseId: randomUUID(), familyId, memberId: typeof body.memberId === 'string' ? body.memberId : undefined, caseCategoryId, caseCategoryName, subService: typeof body.subService === 'string' ? body.subService.trim() : undefined });
      return NextResponse.json({success:true,status:'case_created',familyId},{status:201});
    }
    return NextResponse.json({success:false,code:'UNSUPPORTED_FAMILY_ACTION'},{status:400});
  } catch (error) {
    console.error('customer-family resource creation failed', error);
    return NextResponse.json({success:false,code:'FAMILY_RESOURCE_WRITE_FAILED'},{status:500});
  }
}
