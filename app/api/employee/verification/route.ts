import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../../lib/ycm-access-control';

export const runtime = 'nodejs';

const db = () => {
  const u = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return u ? postgres(u, { max: 5, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};
const managers = new Set(['team_lead','branch_manager','management','ceo','admin']);

export async function GET(r: NextRequest) {
  const s = verifySession(r.cookies.get(sessionCookieName())?.value);
  if (!s || (!managers.has(s.role) && s.role !== 'employee')) return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
  const userId = r.nextUrl.searchParams.get('userId')?.trim() || s.sub;
  const sql = db(); if (!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  try {
    if (s.role === 'employee' && userId !== s.sub) return NextResponse.json({success:false,code:'EMPLOYEE_SCOPE_DENIED'},{status:403});
    const verification = (await sql`SELECT * FROM ycm_employee_verifications WHERE user_id=${userId} LIMIT 1`)[0] || null;
    const events = verification ? await sql`SELECT event_id,event_type,score,details,actor_user_id,created_at FROM ycm_employee_verification_events WHERE verification_id=${verification.verification_id} ORDER BY created_at DESC LIMIT 100` : [];
    return NextResponse.json({success:true,verification,events});
  } finally { await sql.end({timeout:3}); }
}

export async function POST(r: NextRequest) {
  const s = verifySession(r.cookies.get(sessionCookieName())?.value);
  if (!s || !managers.has(s.role)) return NextResponse.json({success:false,code:'MANAGER_AUTH_REQUIRED'},{status:403});
  const b = await r.json().catch(()=>null) as Record<string,unknown>|null;
  const userId = String(b?.userId||'').trim();
  const status = String(b?.status||'').trim();
  if (!userId || !['pending','verified','suspended','rejected'].includes(status)) return NextResponse.json({success:false,code:'VERIFICATION_INPUT_INVALID'},{status:400});
  const score = b?.testScore == null ? null : Number(b.testScore);
  const testPassedAt = typeof b?.testPassedAt === 'string' ? b.testPassedAt : null;
  const trainingCompletedAt = typeof b?.trainingCompletedAt === 'string' ? b.trainingCompletedAt : null;
  const notes = typeof b?.notes === 'string' ? b.notes.trim() : null;
  const metadata = b?.metadata == null ? {} : b.metadata;
  if (notes && notes.length > 5000) return NextResponse.json({success:false,code:'NOTES_TOO_LONG'},{status:400});
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) return NextResponse.json({success:false,code:'TEST_SCORE_INVALID'},{status:400});
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return NextResponse.json({success:false,code:'METADATA_INVALID'},{status:400});
  if (JSON.stringify(metadata).length > 20000) return NextResponse.json({success:false,code:'METADATA_TOO_LARGE'},{status:400});
  const sql = db(); if (!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  try {
    const target = (await sql`SELECT user_id,role,status FROM ycm_users WHERE user_id=${userId} LIMIT 1`)[0];
    if (!target || target.role !== 'employee') return NextResponse.json({success:false,code:'EMPLOYEE_NOT_FOUND'},{status:404});
    const verification = (await sql`INSERT INTO ycm_employee_verifications(user_id,status,test_score,test_passed_at,training_completed_at,verified_by_user_id,verified_at,suspended_at,notes,metadata)
      VALUES(${userId},${status},${score},${testPassedAt},${trainingCompletedAt},${s.sub},CASE WHEN ${status}='verified' THEN NOW() ELSE NULL END,CASE WHEN ${status}='suspended' THEN NOW() ELSE NULL END,${notes},${JSON.stringify(metadata)}::jsonb)
      ON CONFLICT(user_id) DO UPDATE SET status=EXCLUDED.status,test_score=EXCLUDED.test_score,test_passed_at=EXCLUDED.test_passed_at,training_completed_at=EXCLUDED.training_completed_at,verified_by_user_id=EXCLUDED.verified_by_user_id,verified_at=EXCLUDED.verified_at,suspended_at=EXCLUDED.suspended_at,notes=EXCLUDED.notes,metadata=EXCLUDED.metadata,updated_at=NOW()
      RETURNING *`)[0];
    const eventType = status === 'pending' ? 'note' : status;
    await sql`INSERT INTO ycm_employee_verification_events(verification_id,user_id,event_type,score,details,actor_user_id)
      VALUES(${verification.verification_id},${userId},${eventType},${score},${JSON.stringify({notes,status,metadata})}::jsonb,${s.sub})`;
    return NextResponse.json({success:true,verification},{status:201});
  } finally { await sql.end({timeout:3}); }
}
