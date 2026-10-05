import { NextRequest, NextResponse } from 'next/server';
import { FAMILY_REGISTRATION_PLAN } from '../../../customer-family';
import { getCustomerFamilyPaymentProvider } from '../../../lib/customer-family-payment';
import { getPostgresCustomerFamilyRepository } from '../../../lib/customer-family-postgres';
import { requireFamilyOwner } from '../../../lib/ycm-authorization';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const provider = getCustomerFamilyPaymentProvider();
  const repository = getPostgresCustomerFamilyRepository();
  if (!provider) return NextResponse.json({ success: false, code: 'PAYMENT_PROVIDER_NOT_CONFIGURED', productionReady: false }, { status: 503 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED', productionReady: false }, { status: 503 });

  const body = await request.json().catch(() => null) as { familyId?: string } | null;
  const familyId = typeof body?.familyId === 'string' ? body.familyId.trim() : '';
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });

  const access = await requireFamilyOwner(request, familyId);
  if (access.response) return access.response;

  const family = await repository.findById(familyId);
  if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });
  if (family.status !== 'pending_payment') {
    return NextResponse.json({ success: false, code: 'FAMILY_NOT_PENDING_PAYMENT', status: family.status }, { status: 409 });
  }

  try {
    const order = await provider.createOrder({
      familyId,
      amount: FAMILY_REGISTRATION_PLAN.amount,
      currency: FAMILY_REGISTRATION_PLAN.currency,
    });
    const paymentId = randomUUID();
    await repository.createPayment({
      paymentId,
      familyId,
      amountPaise: FAMILY_REGISTRATION_PLAN.amount * 100,
      currency: 'INR',
      provider: 'configured',
      providerReference: order.orderId,
    });
    return NextResponse.json({
      success: true,
      familyId,
      paymentId,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      productionReady: true,
    }, { status: 201, headers: { 'Cache-Control': 'private,no-store' } });
  } catch (error) {
    console.error('Family payment order creation failed', error);
    return NextResponse.json({ success: false, code: 'PAYMENT_ORDER_CREATION_FAILED' }, { status: 502 });
  }
}
