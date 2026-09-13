import { NextResponse } from 'next/server';
import { getCustomerFamilyOtpProvider } from '../../../lib/customer-family-otp';
import { getPostgresCustomerFamilyRepository } from '../../../lib/customer-family-postgres';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, code: 'INVALID_JSON' }, { status: 400 }); }
  const mobile = typeof body.mobile === 'string' ? body.mobile.replace(/\s+/g, '') : '';
  const familyId = typeof body.familyId === 'string' ? body.familyId.trim() : '';
  if (!/^\+?[0-9]{10,15}$/.test(mobile)) return NextResponse.json({ success: false, code: 'INVALID_MOBILE' }, { status: 400 });
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });
  const provider = getCustomerFamilyOtpProvider();
  const repository = getPostgresCustomerFamilyRepository();
  if (!provider) return NextResponse.json({ success: false, code: 'OTP_PROVIDER_NOT_CONFIGURED', productionReady: false }, { status: 503 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED', productionReady: false }, { status: 503 });
  const family = await repository.findById(familyId);
  if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });
  if (family.mobile !== mobile) return NextResponse.json({ success: false, code: 'MOBILE_FAMILY_MISMATCH' }, { status: 403 });
  if (family.status !== 'pending_payment') return NextResponse.json({ success: false, code: 'FAMILY_NOT_PENDING_VERIFICATION' }, { status: 409 });
  try {
    const challenge = await provider.sendOtp(mobile, 'family_registration');
    await repository.createOtpChallenge({ challengeId: challenge.challengeId, familyId, mobile, provider: 'configured', expiresAt: challenge.expiresAt });
    return NextResponse.json({ success: true, challengeId: challenge.challengeId, expiresAt: challenge.expiresAt, productionReady: true });
  } catch (error) {
    console.error('Family OTP issuance failed', error);
    return NextResponse.json({ success: false, code: 'OTP_SEND_FAILED' }, { status: 502 });
  }
}
