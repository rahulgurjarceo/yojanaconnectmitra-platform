import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';

function session(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  return verifySession(token);
}

export async function POST(request: NextRequest) {
  const s = session(request);
  if (!s) return NextResponse.json({ success:false, code:'AUTHENTICATION_REQUIRED' }, {status:401});
  if (!['ceo','admin','management'].includes(s.role)) return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
  const body = await request.json().catch(()=>null) as {
    familyId?: string; sourceType?: 'family'|'case'|'document'|'lead'|'task'; sourceId?: string;
    assignedTo?: string; teamId?: string; priority?: 'low'|'normal'|'high'|'urgent'; reason?: string;
  }|null;
  if (!body?.familyId || !body.sourceType || !body.sourceId) return NextResponse.json({success:false,code:'ASSIGNMENT_FIELDS_REQUIRED'},{status:400});
  const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
  if(!url) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  const sql=postgres(url,{max:2,prepare:false,connect_timeout:10,idle_timeout:20});
  try {
    const rows=await sql`INSERT INTO ycm_work_assignments (family_id,source_type,source_id,assigned_by,assigned_to,team_id,priority,reason)
      VALUES (${body.familyId},${body.sourceType},${body.sourceId},(SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1),${body.assignedTo||null},${body.teamId||null},${body.priority||'normal'},${body.reason||null})
      RETURNING assignment_id,family_id,source_type,source_id,assigned_to,team_id,priority,status,reason,due_at,created_at`;
    return NextResponse.json({success:true,assignment:rows[0]},{status:201,headers:{'Cache-Control':'private, no-store'}});
  } catch(e) {
    console.error('work assignment failed',e);
    return NextResponse.json({success:false,code:'ASSIGNMENT_FAILED'},{status:500});
  } finally { await sql.end({timeout:5}); }
}
