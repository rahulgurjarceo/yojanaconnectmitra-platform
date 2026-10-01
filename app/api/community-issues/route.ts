import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';

export const runtime = 'nodejs';

function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10 }) : null;
}

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(sessionCookieName() + '='))?.slice(sessionCookieName().length + 1);
  const session = verifySession(token);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.category) return NextResponse.json({ success: false, code: 'TITLE_AND_CATEGORY_REQUIRED' }, { status: 400 });

  const dbClient = db();
  if (!dbClient) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    const rows = await dbClient`INSERT INTO ycm_community_issues (location_id, family_id, title, category, description, priority, latitude, longitude)
      VALUES (${body.locationId || null}, ${body.familyId || null}, ${String(body.title).slice(0, 240)}, ${String(body.category).slice(0, 80)}, ${body.description ? String(body.description).slice(0, 5000) : null}, ${['low','normal','high','urgent'].includes(body.priority) ? body.priority : 'normal'}, ${body.latitude ?? null}, ${body.longitude ?? null})
      RETURNING issue_id, status, priority, created_at`;
    return NextResponse.json({ success: true, issue: rows[0] }, { status: 201 });
  } finally {
    await dbClient.end({ timeout: 2 });
  }
}

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(sessionCookieName() + '='))?.slice(sessionCookieName().length + 1);
  const session = verifySession(token);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });

  const dbClient = db();
  if (!dbClient) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  const url = new URL(request.url);
  const locationId = url.searchParams.get('locationId');
  try {
    const rows = locationId
      ? await dbClient`SELECT * FROM ycm_community_issues WHERE location_id = ${locationId} ORDER BY updated_at DESC LIMIT 100`
      : await dbClient`SELECT * FROM ycm_community_issues ORDER BY updated_at DESC LIMIT 100`;
    return NextResponse.json({ success: true, issues: rows });
  } finally {
    await dbClient.end({ timeout: 2 });
  }
}
