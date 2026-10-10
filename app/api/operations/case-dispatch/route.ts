import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
import { dispatchCase } from '../../../lib/case-dispatch';

export const runtime = 'nodejs';
const db = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 4, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};
const management = (role: string) => ['ceo', 'admin', 'management'].includes(role);
const dispatchRoles = (role: string) => ['ceo', 'admin', 'management', 'team_lead'].includes(role);

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  if (!management(session.role)) return NextResponse.json({ success: false, code: 'MANAGEMENT_ACCESS_REQUIRED' }, { status: 403 });
  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'new';
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 200);
    const rows = await sql`SELECT c.case_id,c.family_id,c.member_id,c.service_code,c.case_category_name,c.status,c.priority,c.due_at,c.assigned_to,c.escalated_at,c.created_at,c.updated_at,f.full_name AS family_name,f.mobile AS family_mobile
      FROM ycm_family_cases c JOIN ycm_families f ON f.family_id=c.family_id
      WHERE c.status=${status}
      ORDER BY CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,c.due_at NULLS LAST,c.created_at ASC
      LIMIT ${limit}`;
    return NextResponse.json({ success: true, queue: rows }, { headers: { 'Cache-Control': 'private,no-store' } });
  } finally { await sql.end({ timeout: 3 }); }
}

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  if (!dispatchRoles(session.role)) return NextResponse.json({ success: false, code: 'DISPATCH_ACCESS_DENIED' }, { status: 403 });
  const body = await request.json().catch(() => null) as { caseId?: string } | null;
  const caseId = String(body?.caseId || '').trim();
  if (!caseId || caseId.length > 120) return NextResponse.json({ success: false, code: 'CASE_ID_REQUIRED' }, { status: 400 });
  try {
    const result = await dispatchCase(caseId, session.sub);
    return NextResponse.json({ success: true, dispatch: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as Error & { code?: string }).code) : 'CASE_DISPATCH_FAILED';
    const status = code === 'CASE_NOT_FOUND' ? 404 : code === 'CASE_NOT_DISPATCHABLE' || code === 'NO_ROUTING_TEAM' ? 409 : code === 'DATABASE_NOT_CONFIGURED' ? 503 : 500;
    return NextResponse.json({ success: false, code }, { status });
  }
}
