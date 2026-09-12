import { NextResponse } from 'next/server';
import { CASE_UNIVERSE } from '../../case-universe';

export async function GET() {
  return NextResponse.json({
    success: true,
    scope: 'India + International',
    count: CASE_UNIVERSE.length,
    domains: CASE_UNIVERSE,
  });
}
