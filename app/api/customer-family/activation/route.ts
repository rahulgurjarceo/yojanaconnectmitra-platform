import { NextResponse } from 'next/server';
import { getCustomerFamilyRepository } from '../../../lib/customer-family-db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { familyId?: unknown; otpVerified?: unknown; paymentVerified?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_JSON' }, { status: 400 });
  }

  const familyId = typeof body.familyId === 'string' ? body.familyId.trim() : '';
  const otpVerified = body.otpVerified === true;
  const paymentVerified = body.paymentVerified === true;
  const repository = getCustomerFamilyRepository();

  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED', message: 'Production database adapter is not configured.' }, { status: 503 });
  if (!otpVerified) return NextResponse.json({ success: false, code: 'OTP_NOT_VERIFIED' }, { status: 409 });
  if (!paymentVerified) return NextResponse.json({ success: false, code: 'PAYMENT_NOT_VERIFIED' }, { status: 409 });

  const family = await repository.updateStatus(familyId, 'active');
  if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ success: true, familyId, status: 'active', family });
}
