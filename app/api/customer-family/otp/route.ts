import { NextResponse } from 'next/server';
import { PRODUCTION_ADAPTER_STATUS } from '../../../customer-family-production';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, code: 'INVALID_JSON' }, { status: 400 }); }
  const mobile = typeof body.mobile === 'string' ? body.mobile.replace(/\s+/g, '') : '';
  if (!/^\+?[0-9]{10,15}$/.test(mobile)) return NextResponse.json({ success: false, code: 'INVALID_MOBILE' }, { status: 400 });
  if (PRODUCTION_ADAPTER_STATUS.otp !== 'verified') {
    return NextResponse.json({ success: false, code: 'OTP_ADAPTER_NOT_CONFIGURED', message: 'OTP provider is not connected. No OTP is sent or accepted by this endpoint.', productionReady: false }, { status: 503 });
  }
  return NextResponse.json({ success: true, mobile, productionReady: true }, { status: 200 });
}
