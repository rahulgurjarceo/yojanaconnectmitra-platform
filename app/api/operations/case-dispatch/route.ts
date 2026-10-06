import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';

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
    const rows = await sql`SELECT c.case_id,c.family_id,c.member_id,c.service_code,c.case_category_name,c.status,c.priority,c.due_at,c.assigned_to,c.escalated_at,c.created_at,c.updated_at,f.full_name AS family_name,f.mobile AS family_mobile FROM ycm_family_cases c JOIN ycm_families f ON f.family_id=c.family_id WHERE c.status=${status} ORDER BY CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,c.due_at NULLS LAST,c.created_at ASC LIMIT ${limit}`;
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
  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  try {
    const result = await sql.begin(async tx => {
      const c = (await tx`SELECT c.case_id,c.family_id,c.service_code,c.status,c.priority,c.due_at FROM ycm_family_cases c WHERE c.case_id=${caseId} LIMIT 1`)[0] as Record<string, unknown> | undefined;
      if (!c) throw Object.assign(new Error('CASE_NOT_FOUND'), { code: 'CASE_NOT_FOUND' });
      if (['completed','closed','cancelled'].includes(String(c.status))) throw Object.assign(new Error('CASE_NOT_DISPATCHABLE'), { code: 'CASE_NOT_DISPATCHABLE' });
      const service = c.service_code ? (await tx`SELECT service_code,business_domain_code FROM ycm_service_master WHERE service_code=${String(c.service_code)} LIMIT 1`)[0] : null;
      const serviceCode = service?.service_code || null;
      const domainCode = service?.business_domain_code || null;
      const rules = await tx`SELECT r.rule_id,r.team_id,r.sla_minutes,r.priority,t.name AS team_name,t.manager_user_id FROM ycm_case_routing_rules r JOIN ycm_teams t ON t.team_id=r.team_id AND t.status='active' WHERE r.active=true AND ((r.service_code IS NOT NULL AND r.service_code=${serviceCode}) OR (r.business_domain_code IS NOT NULL AND r.business_domain_code=${domainCode})) ORDER BY CASE WHEN r.service_code IS NOT NULL AND r.service_code=${serviceCode} THEN 0 ELSE 1 END,r.priority DESC LIMIT 20`;
      const candidates = (rules as any[]).filter(r => r.manager_user_id);
      if (!candidates.length) {
        const fallback = (await tx`SELECT t.team_id,t.name AS team_name,t.manager_user_id FROM ycm_teams t WHERE t.status='active' AND t.team_type='customer' AND t.manager_user_id IS NOT NULL ORDER BY t.team_id LIMIT 1`)[0];
        if (fallback) candidates.push({ ...fallback, sla_minutes: 1440, priority: 100, rule_id: null });
      }
      if (!candidates.length) throw Object.assign(new Error('NO_ROUTING_TEAM'), { code: 'NO_ROUTING_TEAM' });
      const managerIds = candidates.map(r => r.manager_user_id);
      const loadRows = await tx`SELECT assigned_to,COUNT(*)::int AS open_count FROM ycm_work_assignments WHERE status IN ('assigned','accepted','in_progress','blocked','reassigned') AND assigned_to IN ${tx(managerIds)} GROUP BY assigned_to`;
      const load = new Map((loadRows as any[]).map(r => [String(r.assigned_to), Number(r.open_count)]));
      candidates.sort((a,b) => (load.get(String(a.manager_user_id)) || 0) - (load.get(String(b.manager_user_id)) || 0));
      const chosen = candidates[0];
      const dueAt = new Date(Date.now() + Number(chosen.sla_minutes || 1440) * 60000);
      const existing = (await tx`SELECT assignment_id,status FROM ycm_work_assignments WHERE case_id=${caseId} AND status NOT IN ('completed','reassigned') ORDER BY created_at DESC LIMIT 1`)[0];
      if (existing) return { caseId, teamId: chosen.team_id, teamName: chosen.team_name, reused: true, assignmentId: existing.assignment_id };
      const actor = (await tx`SELECT id FROM ycm_users WHERE user_id=${session.sub} LIMIT 1`)[0]?.id || null;
      const assignment = (await tx`INSERT INTO ycm_work_assignments(family_id,case_id,source_type,source_id,assigned_by,assigned_to,team_id,priority,status,reason,due_at) VALUES(${String(c.family_id)},${caseId},'case',${caseId},${actor},${chosen.manager_user_id},${chosen.team_id},${String(c.priority || 'normal')},'assigned','Deterministic case dispatch',${dueAt}) RETURNING assignment_id,assigned_to,team_id,due_at`)[0];
      await tx`UPDATE ycm_family_cases SET assigned_to=${chosen.manager_user_id},due_at=${dueAt},updated_at=NOW() WHERE case_id=${caseId}`;
      await tx`INSERT INTO ycm_case_timeline(case_id,family_id,event_type,actor_type,actor_id,note,metadata) VALUES(${caseId},${String(c.family_id)},'dispatched','system',${session.sub},'Case automatically routed to the least-loaded eligible team lead',${JSON.stringify({ teamId: chosen.team_id, teamName: chosen.team_name, assignmentId: assignment.assignment_id, slaMinutes: Number(chosen.sla_minutes || 1440) })}::jsonb)`;
      return { caseId, teamId: chosen.team_id, teamName: chosen.team_name, assignedTo: assignment.assigned_to, assignmentId: assignment.assignment_id, dueAt: assignment.due_at, reused: false };
    });
    return NextResponse.json({ success: true, dispatch: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as Error & { code?: string }).code) : 'CASE_DISPATCH_FAILED';
    const status = code === 'CASE_NOT_FOUND' ? 404 : code === 'CASE_NOT_DISPATCHABLE' || code === 'NO_ROUTING_TEAM' ? 409 : 500;
    return NextResponse.json({ success: false, code }, { status });
  } finally { await sql.end({ timeout: 3 }); }
}