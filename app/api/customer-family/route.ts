import { NextResponse } from 'next/server';
import {
  FAMILY_360_LIFECYCLE,
  FAMILY_REGISTRATION_PLAN,
  buildFamilyId,
  validateFamilyRegistrationPayload,
} from '../../customer-family';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'customer-family-360',
    plan: FAMILY_REGISTRATION_PLAN,
    lifecycle: FAMILY_360_LIFECYCLE,
    storage: { mode: 'database-adapter-required', productionReady: false },
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

  const familyId = buildFamilyId();
  return NextResponse.json({
    success: true,
    status: 'registration_request_created',
    familyId,
    plan: FAMILY_REGISTRATION_PLAN,
    primaryMember: {
      fullName: validation.data.fullName,
      mobile: validation.data.mobile,
      country: validation.data.country,
    },
    message: 'Registration request created. OTP, payment verification and persistent database adapters must be connected before this becomes a production family account.',
    next: ['OTP verification', 'Payment gateway signature verification', 'Database persistence', 'Family activation'],
    productionReady: false,
  }, { status: 202 });
}
