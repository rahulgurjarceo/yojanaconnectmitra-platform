import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false}):null};
const roles=['employee','team_lead','branch_manager','management','admin','ceo'];
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const b=await r.json();const dueAt=String(b.dueAt||'');if(!dueAt)return NextResponse.json({success:false,code:'DUE_AT_REQUIRED'},{status:400});
  const leadId=b.leadId?String(b.leadId):null;
  if(leadId){const q=await sql`SELECT lead_id FROM ycm_leads WHERE lead_id=${leadId} AND assigned_to=${s.sub} LIMIT 1`;if(!q[0]&&s.role==='employee')return NextResponse.json({success:false,code:'LEAD_NOT_ASSIGNED'},{status:403});}
  const x=await sql`INSERT INTO ycm_employee_followups(employee_user_id,lead_id,followup_type,due_at,priority,notes,created_by) VALUES(${s.sub},${leadId},${String(b.followupType||'callback')},${dueAt},${String(b.priority||'normal')},${b.notes||null},${s.sub}) RETURNING followup_id`;
  if(leadId)await sql`UPDATE ycm_leads SET next_follow_up_at=${dueAt},status=CASE WHEN status NOT IN ('converted','closed','lost') THEN 'follow_up' ELSE status END,updated_at=NOW() WHERE lead_id=${leadId} AND assigned_to=${s.sub}`;
  return NextResponse.json({success:true,followupId:x[0].followup_id});
 }catch{return NextResponse.json({success:false,code:'FOLLOWUP_CREATE_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const b=await r.json();const id=String(b.followupId||'');if(!id)return NextResponse.json({success:false,code:'FOLLOWUP_ID_REQUIRED'},{status:400});
  const q=await sql`SELECT employee_user_id FROM ycm_employee_followups WHERE followup_id=${id} LIMIT 1`;if(!q[0])return NextResponse.json({success:false,code:'FOLLOWUP_NOT_FOUND'},{status:404});
  if(s.role==='employee'&&q[0].employee_user_id!==s.sub)return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
  const status=String(b.status||'completed');if(!['pending','completed','overdue','cancelled'].includes(status))return NextResponse.json({success:false,code:'STATUS_INVALID'},{status:400});
  await sql`UPDATE ycm_employee_followups SET status=${status},outcome=${b.outcome||null},notes=COALESCE(${b.notes||null},notes),completed_at=CASE WHEN ${status}='completed' THEN NOW() ELSE completed_at END,updated_at=NOW() WHERE followup_id=${id}`;
  return NextResponse.json({success:true});
 }catch{return NextResponse.json({success:false,code:'FOLLOWUP_UPDATE_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}