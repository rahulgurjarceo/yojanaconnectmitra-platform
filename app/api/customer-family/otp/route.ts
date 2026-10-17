import { NextResponse } from 'next/server';
import { getCustomerFamilyOtpProvider } from '../../../lib/customer-family-otp';
import { getPostgresCustomerFamilyRepository } from '../../../lib/customer-family-postgres';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_JSON' }, { status: 400 });
  }

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

  // Reserve a slot atomically before calling the paid SMS/OTP provider.
  // Limits: one request per mobile per minute, maximum five per rolling hour window.
  let allowed: boolean;
  try {
    allowed = await repository.reserveOtpSend(mobile);
  } catch (error) {
    const code = error instanceof Error && error.message === 'OTP_RATE_LIMIT_SECRET_NOT_CONFIGURED'
      ? 'OTP_RATE_LIMIT_SECRET_NOT_CONFIGURED'
      : 'OTP_RATE_LIMIT_CHECK_FAILED';
    console.error('Family OTP rate-limit reservation failed');
    return NextResponse.json({ success: false, code, productionReady: false }, { status: 503 });
  }
  if (!allowed) {
    return NextResponse.json(
      { success: false, code: 'OTP_RATE_LIMITED', message: 'Please wait before requesting another OTP.' },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const challenge = await provider.sendOtp(mobile, 'family_registration');
    await repository.createOtpChallenge({ challengeId: challenge.challengeId, familyId, mobile, provider: 'configured', expiresAt: challenge.expiresAt });
    return NextResponse.json(
      { success: true, challengeId: challenge.challengeId, expiresAt: challenge.expiresAt, productionReady: true },
      { headers: { 'Cache-Control': 'private,no-store' } },
    );
  } catch (error) {
    console.error('Family OTP issuance failed');
    return NextResponse.json({ success: false, code: 'OTP_SEND_FAILED' }, { status: 502 });
  }
}
