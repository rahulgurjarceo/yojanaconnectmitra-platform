import { NextResponse } from 'next/server';
import { getCustomerFamilyRepository } from '../../../lib/customer-family-db';

export const runtime = 'nodejs';

export async function GET() {
  const databaseConfigured = Boolean(getCustomerFamilyRepository());
  const otpConfigured = Boolean(process.env.YCM_OTP_PROVIDER && process.env.YCM_OTP_API_KEY);
  const paymentConfigured = Boolean(process.env.YCM_PAYMENT_PROVIDER && process.env.YCM_PAYMENT_SECRET);

  return NextResponse.json({
    success: true,
    service: 'customer-family-360',
    readiness: {
      database: databaseConfigured,
      otp: otpConfigured,
      payment: paymentConfigured,
      activation: databaseConfigured && otpConfigured && paymentConfigured,
    },
    requiredEnvironment: [
      'YCM_OTP_PROVIDER',
      'YCM_OTP_API_KEY',
      'YCM_PAYMENT_PROVIDER',
      'YCM_PAYMENT_SECRET',
      'DATABASE_URL',
    ],
    productionReady: false,
    message: databaseConfigured && otpConfigured && paymentConfigured
      ? 'All adapter prerequisites are configured; run integration and payment verification before activation.'
      : 'One or more production adapters are not configured yet.',
  });
}
