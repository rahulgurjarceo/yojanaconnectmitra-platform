import { NextResponse } from 'next/server';
import { getPostgresCustomerFamilyRepository } from '../../../../lib/customer-family-postgres';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const repository = getPostgresCustomerFamilyRepository();
  if (!repository) {
    return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { familyId?: string } | null;
  if (!body?.familyId || !/^[A-Z0-9-]{6,64}$/.test(body.familyId)) {
    return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });
  }

  try {
    const family = await repository.findById(body.familyId);
    if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });
    if (family.status === 'active') {
      return NextResponse.json({ success: true, familyId: family.familyId, status: 'active', family });
    }
    if (family.status !== 'pending_payment') {
      return NextResponse.json({ success: false, code: 'FAMILY_NOT_ACTIVATABLE', status: family.status }, { status: 409 });
    }

    // Never trust otpVerified/paymentVerified values supplied by the browser.
    // Activation is allowed only when the database records both verified events.
    const state = await repository.getActivationState(family.familyId);
    if (!state.otpVerified || !state.paymentVerified) {
      return NextResponse.json({
        success: false,
        code: 'ACTIVATION_PREREQUISITES_INCOMPLETE',
        requirements: state,
      }, { status: 409 });
    }

    const activated = await repository.updateStatus(family.familyId, 'active');
    return NextResponse.json({ success: true, familyId: family.familyId, status: 'active', family: activated });
  } catch (error) {
    console.error('customer-family activation failed', error);
    return NextResponse.json({ success: false, code: 'ACTIVATION_FAILED' }, { status: 500 });
  }
}
