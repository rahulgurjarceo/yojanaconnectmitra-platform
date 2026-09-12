import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const familyId = `YCM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  return NextResponse.json({
    success: true,
    familyId,
    plan: 'Family Registration',
    amount: 99,
    validityYears: 2,
    status: 'created-demo',
    received: body,
    next: 'Connect OTP, payment signature verification and persistent database before production use.',
  }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ service: 'family-registration', planAmount: 99, validityYears: 2, status: 'demo-api' });
}
