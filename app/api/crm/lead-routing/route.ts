import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const managers=new Set(['ceo','management','admin','team_lead','branch_manager']);
const roles=['employee','team_lead','branch_manager','management','admin'];
const str=(v:unknown,m=200)=>{const x=String(v??'').trim();return x&&x.length<=m?x:null};
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s||!managers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json().catch(()=>({})) as Record<string,unknown>,action=str(b.action,20),leadId=str(b.leadId,120);
  if(!action||!['distribute','recycle'].includes(action))return NextResponse.json({success:false,code:'ROUTING_ACTION_INVALID'},{status:400});
  const lead=leadId?(await sql`SELECT * FROM ycm_leads WHERE lead_id=${leadId} LIMIT 1`)[0]:(await sql`SELECT * FROM ycm_leads WHERE status IN ('new','qualified','assigned','follow_up') ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,lead_score DESC,created_at ASC LIMIT 1`)[0];
  if(!lead)return NextResponse.json({success:false,code:'LEAD_NOT_FOUND'},{status:404});
  const rule=(await sql`SELECT * FROM ycm_lead_routing_rules WHERE active=true AND (service_code IS NULL OR service_code=${lead.service_code}) AND (state_code IS NULL OR state_code=${lead.state_code}) AND (district_code IS NULL OR district_code=${lead.district_code}) ORDER BY priority ASC LIMIT 1`)[0];
  const strategy=rule?.strategy||'least_loaded',maxAttempts=Number(rule?.max_attempts||3),current=lead.assigned_to||null;
  const assignee=(await sql`SELECT u.id,u.user_id FROM ycm_users u WHERE u.status='active' AND u.role=ANY(${sql.array(roles)}) AND u.id<>COALESCE(${current},'00000000-0000-0000-0000-000000000000') ORDER BY (SELECT COUNT(*) FROM ycm_leads x WHERE x.assigned_to=u.id AND x.status NOT IN ('converted','lost','closed')) ASC,u.created_at ASC LIMIT 1`)[0];
  const sequence=Number((await sql`SELECT COALESCE(MAX(sequence_no),0)+1 n FROM ycm_lead_assignments WHERE lead_id=${lead.lead_id}`)[0]?.n||1);
  if(action==='recycle'&&sequence>maxAttempts){
   const updated=(await sql`UPDATE ycm_leads SET status='lost',lost_reason='MAX_ROUTING_ATTEMPTS',updated_at=NOW() WHERE lead_id=${lead.lead_id} RETURNING *`)[0];
   await sql`INSERT INTO ycm_lead_routing_events(lead_id,from_user_id,event_type,reason,metadata) VALUES(${lead.lead_id},${current},'closed_after_max_attempts','Maximum routing attempts reached',${JSON.stringify({sequence,maxAttempts})}::jsonb)`;
   return NextResponse.json({success:true,action:'closed',lead:updated});
  }
  if(!assignee)return NextResponse.json({success:false,code:'NO_ACTIVE_ASSIGNEE'},{status:409});
  const slaMinutes=Number(rule?.sla_minutes||30);
  const updated=(await sql`UPDATE ycm_leads SET assigned_to=${assignee.id},status='assigned',assigned_at=NOW(),sla_due_at=NOW()+(${slaMinutes}||' minutes')::interval,attempt_count=${sequence},assignment_version=assignment_version+1,updated_at=NOW() WHERE lead_id=${lead.lead_id} RETURNING *`)[0];
  await sql`INSERT INTO ycm_lead_assignments(lead_id,assignee_user_id,rule_id,sequence_no,release_reason) VALUES(${lead.lead_id},${assignee.id},${rule?.rule_id||null},${sequence},${action==='recycle'?'SLA_OR_NO_CONVERSION':null})`;
  await sql`INSERT INTO ycm_lead_routing_events(lead_id,from_user_id,to_user_id,event_type,reason,metadata) VALUES(${lead.lead_id},${current},${assignee.id},${action==='recycle'?'reassigned':'assigned'},${action==='recycle'?'Previous owner did not convert within routing window':'Initial rule-based distribution'},${JSON.stringify({strategy,sequence,slaMinutes})}::jsonb)`;
  return NextResponse.json({success:true,action,lead:updated,assignedTo:assignee.user_id,sequence,strategy});
 }catch{return NextResponse.json({success:false,code:'LEAD_ROUTING_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}