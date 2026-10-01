import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';

export const runtime = 'nodejs';

function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10 }) : null;
}

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(sessionCookieName() + '='))?.slice(sessionCookieName().length + 1);
  if (!verifySession(token)) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });

  const url = new URL(request.url);
  const locationId = url.searchParams.get('locationId');
  const dbClient = db();
  if (!dbClient) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    if (!locationId) {
      const levels = await dbClient`SELECT level, COUNT(*)::int AS count FROM ycm_location_units WHERE status = 'active' GROUP BY level ORDER BY level`;
      return NextResponse.json({ success: true, levels });
    }

    const locationRows = await dbClient`SELECT location_id, parent_location_id, level, code, name, state_code, district_code, block_code, gram_panchayat_code, village_code, latitude, longitude, source_name, source_url, last_verified_at, status FROM ycm_location_units WHERE location_id = ${locationId} LIMIT 1`;
    if (!locationRows.length) return NextResponse.json({ success: false, code: 'LOCATION_NOT_FOUND' }, { status: 404 });

    const officials = await dbClient`SELECT official_id, office_type, designation, full_name, phone, email, office_address, working_hours, weekly_off, today_status, source_name, source_url, last_verified_at, status FROM ycm_local_officials WHERE location_id = ${locationId} AND status = 'active' ORDER BY designation`;
    return NextResponse.json({ success: true, location: locationRows[0], officials });
  } finally {
    await dbClient.end({ timeout: 2 });
  }
}
