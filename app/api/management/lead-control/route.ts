import { NextRequest,NextResponse } from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs'; const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:8,prepare:false}):null};
const managers=new Set(['ceo','admin','management','team_lead','branch_manager']);
const employees=['employee','team_lead','branch_manager'];
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value); if(!s||!managers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const date=r.nextUrl.searchParams.get('date')||new Date().toISOString().slice(0,10);
  const [settings,people,summary]=await Promise.all([
   sql`SELECT target_per_day FROM ycm_lead_daily_settings WHERE setting_key='default_employee_daily_target' LIMIT 1`,
   sql`SELECT u.id,u.user_id,u.role,u.status,COALESCE(d.target_count,200) target_count,COALESCE(d.distributed_count,0) distributed_count,COALESCE(d.called_count,0) called_count,COALESCE(d.connected_count,0) connected_count,COALESCE(d.no_answer_count,0) no_answer_count,(SELECT COUNT(*) FROM ycm_leads l WHERE l.assigned_to=u.id AND l.status NOT IN ('converted','lost','closed')) active_bucket FROM ycm_users u LEFT JOIN ycm_lead_daily_distribution d ON d.employee_user_id=u.id AND d.distribution_date=${date} WHERE u.role=ANY(${sql.array(employees)}) AND u.status='active' ORDER BY active_bucket ASC,u.created_at ASC`,
   sql`SELECT COUNT(*) FILTER(WHERE created_at::date=${date}) new_leads,COUNT(*) FILTER(WHERE assigned_at::date=${date}) assigned_today,COUNT(*) FILTER(WHERE last_call_at::date=${date}) called_today,COUNT(*) FILTER(WHERE last_call_outcome='connected' AND last_call_at::date=${date}) connected_today FROM ycm_leads`
  ]);
  return NextResponse.json({success:true,date,targetPerDay:Number(settings[0]?.target_per_day||200),employees:people,summary:summary[0]||{}});
 }catch{return NextResponse.json({success:false,code:'LEAD_CONTROL_LOAD_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!managers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json() as Record<string,unknown>;const action=String(b.action||'');const employeeId=String(b.employeeId||'').trim();const leadId=String(b.leadId||'').trim();const count=Math.max(1,Math.min(1000,Number(b.count||0)));
  if(action==='set_target'){const target=Math.max(1,Math.min(5000,Number(b.targetPerDay||200)));await sql`UPDATE ycm_lead_daily_settings SET target_per_day=${target},updated_by=${s.userId},updated_at=NOW() WHERE setting_key='default_employee_daily_target'`;return NextResponse.json({success:true,targetPerDay:target});}
  if(action==='transfer'){
   if(!employeeId||!leadId)return NextResponse.json({success:false,code:'TRANSFER_FIELDS_REQUIRED'},{status:400});
   const e=(await sql`SELECT id FROM ycm_users WHERE id=${employeeId} AND role=ANY(${sql.array(employees)}) AND status='active' LIMIT 1`)[0];if(!e)return NextResponse.json({success:false,code:'EMPLOYEE_NOT_FOUND'},{status:404});
   const l=(await sql`SELECT lead_id,assigned_to FROM ycm_leads WHERE lead_id=${leadId} LIMIT 1`)[0];if(!l)return NextResponse.json({success:false,code:'LEAD_NOT_FOUND'},{status:404});
   await sql`UPDATE ycm_leads SET assigned_to=${employeeId},status='assigned',assigned_at=NOW(),assignment_version=assignment_version+1,updated_at=NOW() WHERE lead_id=${leadId}`;
   await sql`INSERT INTO ycm_lead_routing_events(lead_id,from_user_id,to_user_id,event_type,reason) VALUES(${leadId},${l.assigned_to},${employeeId},'manager_transfer','Manager bucket transfer')`;
   await sql`INSERT INTO ycm_lead_assignments(lead_id,assignee_user_id,sequence_no,release_reason) VALUES(${leadId},${employeeId},(SELECT COALESCE(MAX(sequence_no),0)+1 FROM ycm_lead_assignments a WHERE a.lead_id=${leadId}),'MANAGER_TRANSFER')`;
   return NextResponse.json({success:true});
  }
  if(action==='distribute'){
   if(count<1)return NextResponse.json({success:false,code:'COUNT_REQUIRED'},{status:400});
   let assigned=0;
   for(let i=0;i<count;i++){
    const lead=(await sql`SELECT lead_id FROM ycm_leads WHERE status IN ('new','qualified','follow_up') AND (assigned_to IS NULL OR assigned_to='00000000-0000-0000-0000-000000000000') ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,lead_score DESC,created_at ASC LIMIT 1`)[0];
    if(!lead)break;
    const e=(await sql`SELECT u.id FROM ycm_users u WHERE u.role=ANY(${sql.array(employees)}) AND u.status='active' ORDER BY (SELECT COUNT(*) FROM ycm_leads x WHERE x.assigned_to=u.id AND x.status NOT IN ('converted','lost','closed')) ASC,u.created_at ASC LIMIT 1`)[0];
    if(!e)break;
    await sql`UPDATE ycm_leads SET assigned_to=${e.id},status='assigned',assigned_at=NOW(),assignment_version=assignment_version+1,updated_at=NOW() WHERE lead_id=${lead.lead_id} AND (assigned_to IS NULL OR assigned_to='00000000-0000-0000-0000-000000000000')`;
    await sql`INSERT INTO ycm_lead_assignments(lead_id,assignee_user_id,sequence_no,release_reason) VALUES(${lead.lead_id},${e.id},1,'DAILY_MANAGER_DISTRIBUTION')`;
    await sql`INSERT INTO ycm_lead_daily_distribution(distribution_date,employee_user_id,target_count,distributed_count) VALUES(CURRENT_DATE,${e.id},200,1) ON CONFLICT(distribution_date,employee_user_id) DO UPDATE SET distributed_count=ycm_lead_daily_distribution.distributed_count+1`;
    assigned++;
   }
   return NextResponse.json({success:true,assigned,requested:count});
  }
  return NextResponse.json({success:false,code:'ACTION_INVALID'},{status:400});
 }catch{return NextResponse.json({success:false,code:'LEAD_CONTROL_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
