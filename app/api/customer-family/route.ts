import { NextResponse } from 'next/server';
import {
  FAMILY_360_LIFECYCLE,
  FAMILY_REGISTRATION_PLAN,
  buildFamilyId,
  validateFamilyRegistrationPayload,
} from '../../customer-family';
import { getPostgresCustomerFamilyRepository } from '../../lib/customer-family-postgres';

export const runtime = 'nodejs';

export async function GET() {
  const repository = getPostgresCustomerFamilyRepository();
  return NextResponse.json({
    success: true,
    service: 'customer-family-360',
    plan: FAMILY_REGISTRATION_PLAN,
    lifecycle: FAMILY_360_LIFECYCLE,
    storage: { mode: repository ? 'postgres' : 'database-not-configured', productionReady: repository !== null },
    authentication: { mode: 'otp-adapter-required', productionReady: false },
    payment: { mode: 'gateway-signature-verification-required', productionReady: false },
    security: {
      pii: 'minimum-necessary',
      aadhaar: 'do-not-store-raw',
      consent: 'required-before-service-processing',
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_JSON', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const validation = validateFamilyRegistrationPayload(body);
  if (!validation.valid) {
    return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', errors: validation.errors }, { status: 400 });
  }

  const repository = getPostgresCustomerFamilyRepository();
  if (!repository) {
    return NextResponse.json({
      success: false,
      code: 'DATABASE_NOT_CONFIGURED',
      message: 'Family account was not created. Configure DATABASE_URL or POSTGRES_URL and run database/migrations/001_customer_family.sql first.',
      productionReady: false,
    }, { status: 503 });
  }

  const familyId = buildFamilyId();
  try {
    const record = await repository.create({
      familyId,
      status: 'pending_payment',
      fullName: validation.data.fullName,
      mobile: validation.data.mobile,
      country: validation.data.country,
    });

    return NextResponse.json({
      success: true,
      status: 'registration_request_created',
      family: record,
      plan: FAMILY_REGISTRATION_PLAN,
      message: 'Family registration request persisted. OTP verification and payment authorization are still required before activation.',
      next: ['OTP verification', 'Payment gateway signature verification', 'Family activation'],
      productionReady: false,
    }, { status: 201 });
  } catch (error) {
    console.error('customer-family create failed', error);
    return NextResponse.json({
      success: false,
      code: 'DATABASE_WRITE_FAILED',
      message: 'Family registration could not be persisted.',
    }, { status: 500 });
  }
}
