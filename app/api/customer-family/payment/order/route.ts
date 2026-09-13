import { NextResponse } from 'next/server';
import { getCustomerFamilyPaymentProvider } from '../../../../lib/customer-family-payment';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyPaymentProvider();
  if (!provider) {
    return NextResponse.json({ success: false, code: 'PAYMENT_PROVIDER_NOT_CONFIGURED', message: 'Payment gateway is not configured on the production server.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { familyId?: string } | null;
  if (!body?.familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });

  const order = await provider.createOrder({ familyId: body.familyId, amount: 99, currency: 'INR' });
  return NextResponse.json({ success: true, order }, { status: 201 });
}
