import { NextResponse } from 'next/server';
import { getCustomerFamilyOtpProvider } from '../../../../lib/customer-family-otp';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyOtpProvider();
  if (!provider) return NextResponse.json({ success: false, code: 'OTP_PROVIDER_NOT_CONFIGURED' }, { status: 503 });

  const body = await request.json().catch(() => null) as { challengeId?: string; otp?: string } | null;
  if (!body?.challengeId || !body.otp || !/^\d{4,8}$/.test(body.otp)) {
    return NextResponse.json({ success: false, code: 'OTP_VERIFICATION_FIELDS_REQUIRED' }, { status: 400 });
  }

  const result = await provider.verifyOtp(body.challengeId, body.otp);
  if (!result.verified) return NextResponse.json({ success: false, code: 'OTP_INVALID' }, { status: 400 });
  return NextResponse.json({ success: true, status: 'otp_verified' });
}
