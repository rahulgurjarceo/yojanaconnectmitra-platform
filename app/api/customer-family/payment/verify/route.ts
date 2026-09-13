import { NextResponse } from 'next/server';
import { getCustomerFamilyPaymentProvider } from '../../../../lib/customer-family-payment';
import { getPostgresCustomerFamilyRepository } from '../../../../lib/customer-family-postgres';
import { requireFamilyOwner } from '../../../../lib/ycm-authorization';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyPaymentProvider();
  const repository = getPostgresCustomerFamilyRepository();
  if (!provider) return NextResponse.json({ success: false, code: 'PAYMENT_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  const body = await request.json().catch(() => null) as { familyId?: string; orderId?: string; paymentId?: string; signature?: string } | null;
  const familyId = typeof body?.familyId === 'string' ? body.familyId.trim() : '';
  if (!familyId || !body?.orderId || !body.paymentId || !body.signature) {
    return NextResponse.json({ success: false, code: 'PAYMENT_VERIFICATION_FIELDS_REQUIRED' }, { status: 400 });
  }

  const access = await requireFamilyOwner(request, familyId);
  if (!access.ok) return access.response;

  const payment = await repository.getPaymentByProviderReference(body.orderId);
  if (!payment) return NextResponse.json({ success: false, code: 'PAYMENT_ORDER_NOT_FOUND' }, { status: 404 });
  if (payment.familyId !== familyId) return NextResponse.json({ success: false, code: 'PAYMENT_FAMILY_MISMATCH' }, { status: 403 });
  if (payment.amountPaise !== 9900 || payment.currency !== 'INR') return NextResponse.json({ success: false, code: 'PAYMENT_AMOUNT_MISMATCH' }, { status: 409 });
  if (payment.status === 'success' && payment.signatureVerified) return NextResponse.json({ success: true, status: 'payment_verified', idempotent: true });
  if (!['created', 'pending'].includes(payment.status)) return NextResponse.json({ success: false, code: 'PAYMENT_ORDER_NOT_ACTIVE' }, { status: 409 });

  try {
    const result = await provider.verifyPayment({ orderId: body.orderId, paymentId: body.paymentId, signature: body.signature });
    if (!result.verified) return NextResponse.json({ success: false, code: 'PAYMENT_SIGNATURE_INVALID' }, { status: 400 });
    const persisted = await repository.markPaymentVerified(body.orderId, body.paymentId);
    if (!persisted) return NextResponse.json({ success: false, code: 'PAYMENT_ORDER_NOT_ACTIVE' }, { status: 409 });
    return NextResponse.json({ success: true, status: 'payment_verified', familyId });
  } catch (error) {
    console.error('Family payment verification failed', error);
    return NextResponse.json({ success: false, code: 'PAYMENT_VERIFICATION_FAILED' }, { status: 502 });
  }
}
