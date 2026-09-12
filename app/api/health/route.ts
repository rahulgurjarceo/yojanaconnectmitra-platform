import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Yojana Connect Mitra Platform',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    production: {
      database: 'pending',
      authentication: 'pending',
      payments: 'pending',
      verified_data_sources: 'pending',
    },
  });
}
