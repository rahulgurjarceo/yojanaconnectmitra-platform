import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { verifySession, sessionCookieName } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const privileged=(role:string)=>['ceo','admin','management'].includes(role);

export async function POST(request:NextRequest){
 const s=verifySession(request.cookies.get(sessionCookieName())?.value); if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await request.json().catch(()=>null) as Record<string,unknown>|null; const caseId=typeof b?.caseId==='string'?b.caseId.trim():''; const action=typeof b?.action==='string'?b.action:'';
 if(!caseId||!action)return NextResponse.json({success:false,code:'CASE_ID_AND_ACTION_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const c=(await sql`SELECT case_id,family_id,status,priority,due_at,assigned_to FROM ycm_family_cases WHERE case_id=${caseId} LIMIT 1`)[0] as Record<string,unknown>|undefined;
  if(!c)return NextResponse.json({success:false,code:'CASE_NOT_FOUND'},{status:404});
  if(!privileged(s.role)&&s.familyId!==c.family_id)return NextResponse.json({success:false,code:'CASE_ACCESS_DENIED'},{status:403});
  if(!privileged(s.role)&&['assign','escalate','complete'].includes(action))return NextResponse.json({success:false,code:'MANAGEMENT_ACCESS_REQUIRED'},{status:403});
  if(action==='assign'){
   const assignedTo=typeof b.assignedTo==='string'?b.assignedTo.trim():''; if(!assignedTo)return NextResponse.json({success:false,code:'ASSIGNEE_REQUIRED'},{status:400});
   await sql.begin(async tx=>{await tx`UPDATE ycm_family_cases SET assigned_to=${assignedTo},updated_at=NOW() WHERE case_id=${caseId}`;await tx`INSERT INTO ycm_work_assignments(family_id,case_id,source_type,source_id,assigned_by,assigned_to,priority,status,reason) VALUES(${c.family_id},${caseId},'case',${caseId},${s.sub||null},${assignedTo},${c.priority||'normal'},'assigned','Human Mitra assignment')`;await tx`INSERT INTO ycm_case_timeline(case_id,family_id,event_type,actor_type,actor_id,note,metadata) VALUES(${caseId},${c.family_id},'assigned','user',${s.sub||null},'Case assigned to Human Mitra',${JSON.stringify({assignedTo})}::jsonb)`});
   return NextResponse.json({success:true,status:'assigned',caseId,assignedTo});
  }
  if(action==='escalate'){
   const reason=typeof b.reason==='string'?b.reason.trim():'Automatic/manual escalation';
   await sql.begin(async tx=>{await tx`UPDATE ycm_family_cases SET escalated_at=COALESCE(escalated_at,NOW()),updated_at=NOW() WHERE case_id=${caseId}`;await tx`UPDATE ycm_work_assignments SET status='reassigned',escalation_level=escalation_level+1,updated_at=NOW() WHERE case_id=${caseId} AND status NOT IN ('completed','reassigned')`;await tx`INSERT INTO ycm_case_timeline(case_id,family_id,event_type,actor_type,actor_id,note,metadata) VALUES(${caseId},${c.family_id},'escalated','system',NULL,${reason},'{}'::jsonb)`});
   return NextResponse.json({success:true,status:'escalated',caseId});
  }
  if(action==='status'){
   const next=typeof b.status==='string'?b.status.trim():'';if(!next)return NextResponse.json({success:false,code:'STATUS_REQUIRED'},{status:400});
   await sql.begin(async tx=>{await tx`UPDATE ycm_family_cases SET status=${next},updated_at=NOW() WHERE case_id=${caseId}`;await tx`INSERT INTO ycm_case_timeline(case_id,family_id,event_type,from_status,to_status,actor_type,actor_id,metadata) VALUES(${caseId},${c.family_id},'status_changed',${c.status},${next},'user',${s.sub||null},'{}'::jsonb)`});
   return NextResponse.json({success:true,status:next,caseId});
  }
  return NextResponse.json({success:false,code:'UNSUPPORTED_CASE_OPERATION'},{status:400});
 }catch(e){console.error('case operations failed',e);return NextResponse.json({success:false,code:'CASE_OPERATION_FAILED'},{status:500})}
 finally{await sql.end({timeout:3})}
}

export async function GET(request:NextRequest){
 const s=verifySession(request.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const caseId=new URL(request.url).searchParams.get('caseId')?.trim()||'';if(!caseId)return NextResponse.json({success:false,code:'CASE_ID_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const c=(await sql`SELECT case_id,family_id,status,priority,due_at,assigned_to,escalated_at,outcome_code,csat_score FROM ycm_family_cases WHERE case_id=${caseId}`)[0] as Record<string,unknown>|undefined;if(!c)return NextResponse.json({success:false,code:'CASE_NOT_FOUND'},{status:404});if(!privileged(s.role)&&s.familyId!==c.family_id)return NextResponse.json({success:false,code:'CASE_ACCESS_DENIED'},{status:403});const timeline=await sql`SELECT event_id,event_type,from_status,to_status,actor_type,actor_id,note,metadata,created_at FROM ycm_case_timeline WHERE case_id=${caseId} ORDER BY created_at ASC`;const assignments=await sql`SELECT assignment_id,assigned_to,team_id,priority,status,escalation_level,due_at,reason,created_at,updated_at FROM ycm_work_assignments WHERE case_id=${caseId} ORDER BY created_at DESC`;return NextResponse.json({success:true,case:c,timeline,assignments})}finally{await sql.end({timeout:3})}
}
