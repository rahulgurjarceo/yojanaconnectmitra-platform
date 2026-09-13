import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCustomerFamilyPaymentProvider } from '../../../../lib/customer-family-payment';
import { getPostgresCustomerFamilyRepository } from '../../../../lib/customer-family-postgres';
import { requireFamilyOwner } from '../../../../lib/ycm-authorization';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyPaymentProvider();
  const repository = getPostgresCustomerFamilyRepository();
  if (!provider) return NextResponse.json({ success: false, code: 'PAYMENT_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  const body = await request.json().catch(() => null) as { familyId?: string } | null;
  const familyId = typeof body?.familyId === 'string' ? body.familyId.trim() : '';
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });

  const access = await requireFamilyOwner(request, familyId);
  if (!access.ok) return access.response;

  const family = await repository.findById(familyId);
  if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });
  if (family.status !== 'pending_payment') return NextResponse.json({ success: false, code: 'FAMILY_NOT_PENDING_PAYMENT' }, { status: 409 });

  try {
    const order = await provider.createOrder({ familyId, amount: 99, currency: 'INR' });
    await repository.createPayment({
      paymentId: randomUUID(),
      familyId,
      amountPaise: 9900,
      currency: 'INR',
      provider: 'configured',
      providerReference: order.orderId,
    });
    return NextResponse.json({ success: true, order, familyId }, { status: 201 });
  } catch (error) {
    console.error('Family payment order failed', error);
    return NextResponse.json({ success: false, code: 'PAYMENT_ORDER_FAILED' }, { status: 502 });
  }
}
