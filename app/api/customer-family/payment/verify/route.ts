import { NextResponse } from 'next/server';
import { getCustomerFamilyPaymentProvider } from '../../../../lib/customer-family-payment';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyPaymentProvider();
  if (!provider) return NextResponse.json({ success: false, code: 'PAYMENT_PROVIDER_NOT_CONFIGURED' }, { status: 503 });

  const body = await request.json().catch(() => null) as { orderId?: string; paymentId?: string; signature?: string } | null;
  if (!body?.orderId || !body.paymentId || !body.signature) {
    return NextResponse.json({ success: false, code: 'PAYMENT_VERIFICATION_FIELDS_REQUIRED' }, { status: 400 });
  }

  const result = await provider.verifyPayment({ orderId: body.orderId, paymentId: body.paymentId, signature: body.signature });
  if (!result.verified) return NextResponse.json({ success: false, code: 'PAYMENT_SIGNATURE_INVALID' }, { status: 400 });
  return NextResponse.json({ success: true, status: 'payment_verified' });
}
