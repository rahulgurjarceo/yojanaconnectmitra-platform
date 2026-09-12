import { NextResponse } from 'next/server';
import { FAMILY_REGISTRATION_PLAN } from '../../../customer-family';
import { PRODUCTION_ADAPTER_STATUS } from '../../../customer-family-production';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, code: 'INVALID_JSON' }, { status: 400 }); }
  const familyId = typeof body.familyId === 'string' ? body.familyId.trim() : '';
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });
  if (PRODUCTION_ADAPTER_STATUS.payment !== 'verified') {
    return NextResponse.json({ success: false, code: 'PAYMENT_ADAPTER_NOT_CONFIGURED', message: 'Payment gateway is not connected. No order is created by this endpoint.', amount: FAMILY_REGISTRATION_PLAN.amount, currency: FAMILY_REGISTRATION_PLAN.currency, productionReady: false }, { status: 503 });
  }
  return NextResponse.json({ success: true, familyId, amount: FAMILY_REGISTRATION_PLAN.amount, currency: FAMILY_REGISTRATION_PLAN.currency, productionReady: true });
}
