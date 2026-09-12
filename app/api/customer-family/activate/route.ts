import { NextResponse } from 'next/server';
import { PRODUCTION_ADAPTER_STATUS, FAMILY_PRODUCTION_REQUIREMENTS } from '../../../customer-family-production';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, code: 'INVALID_JSON' }, { status: 400 }); }
  const familyId = typeof body.familyId === 'string' ? body.familyId.trim() : '';
  const otpVerified = body.otpVerified === true;
  const paymentVerified = body.paymentVerified === true;
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });
  const blockers = [
    !otpVerified ? 'otp_verification' : null,
    !paymentVerified ? 'payment_verification' : null,
    PRODUCTION_ADAPTER_STATUS.storage !== 'verified' ? 'database_persistence' : null,
    PRODUCTION_ADAPTER_STATUS.otp !== 'verified' ? 'otp_adapter' : null,
    PRODUCTION_ADAPTER_STATUS.payment !== 'verified' ? 'payment_adapter' : null,
  ].filter(Boolean);
  if (blockers.length) return NextResponse.json({ success: false, code: 'ACTIVATION_BLOCKED', familyId, blockers, activationRule: FAMILY_PRODUCTION_REQUIREMENTS.activationRule, productionReady: false }, { status: 409 });
  return NextResponse.json({ success: true, familyId, status: 'active', productionReady: true });
}
