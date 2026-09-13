import { NextResponse } from 'next/server';
import { getCustomerFamilyOtpProvider } from '../../../../lib/customer-family-otp';
import { getPostgresCustomerFamilyRepository } from '../../../../lib/customer-family-postgres';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyOtpProvider();
  const repository = getPostgresCustomerFamilyRepository();
  if (!provider) return NextResponse.json({ success: false, code: 'OTP_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  const body = await request.json().catch(() => null) as { challengeId?: string; otp?: string } | null;
  if (!body?.challengeId || !body.otp || !/^\d{4,8}$/.test(body.otp)) {
    return NextResponse.json({ success: false, code: 'OTP_VERIFICATION_FIELDS_REQUIRED' }, { status: 400 });
  }
  const result = await provider.verifyOtp(body.challengeId, body.otp);
  if (!result.verified) return NextResponse.json({ success: false, code: 'OTP_INVALID' }, { status: 400 });
  const persisted = await repository.markOtpChallengeVerified(body.challengeId);
  if (!persisted) return NextResponse.json({ success: false, code: 'OTP_CHALLENGE_NOT_ACTIVE' }, { status: 409 });
  return NextResponse.json({ success: true, status: 'otp_verified' });
}
