import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false}):null};
const staff=new Set(['employee','team_lead','branch_manager','management','admin','ceo']);
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value); if(!s||!staff.has(s.role)) return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json() as Record<string,unknown>; const leadId=String(b.leadId||'').trim(); const outcome=String(b.outcome||'').trim(); const notes=String(b.notes||'').trim().slice(0,1000); const duration=Math.max(0,Number(b.durationSeconds||0));
  if(!leadId||!['connected','no_answer','busy','switched_off','invalid_number','callback','not_interested','employee_hangup','customer_hangup'].includes(outcome)) return NextResponse.json({success:false,code:'CALL_OUTCOME_INVALID'},{status:400});
  const lead=(await sql`SELECT lead_id,assigned_to FROM ycm_leads WHERE lead_id=${leadId} LIMIT 1`)[0];
  if(!lead)return NextResponse.json({success:false,code:'LEAD_NOT_FOUND'},{status:404});
  if(s.role==='employee'&&lead.assigned_to!==s.sub)return NextResponse.json({success:false,code:'LEAD_NOT_ASSIGNED'} ,{status:403});
  const connected=outcome==='connected'?1:0, missed=outcome==='no_answer'||outcome==='busy'||outcome==='switched_off'?1:0, employeeHangup=outcome==='employee_hangup'?1:0, customerHangup=outcome==='customer_hangup'?1:0;
  const row=(await sql`INSERT INTO ycm_lead_call_attempts(lead_id,employee_user_id,outcome,duration_seconds,notes) VALUES(${leadId},${s.sub},${outcome},${duration},${notes||null}) RETURNING *`)[0];
  await sql`INSERT INTO ycm_lead_daily_distribution(distribution_date,employee_user_id,target_count,called_count,connected_count,no_answer_count,employee_hangup_count,customer_hangup_count) VALUES(CURRENT_DATE,${s.sub},200,1,${connected},${missed},${employeeHangup},${customerHangup}) ON CONFLICT(distribution_date,employee_user_id) DO UPDATE SET called_count=ycm_lead_daily_distribution.called_count+1,connected_count=ycm_lead_daily_distribution.connected_count+${connected},no_answer_count=ycm_lead_daily_distribution.no_answer_count+${missed},employee_hangup_count=ycm_lead_daily_distribution.employee_hangup_count+${employeeHangup},customer_hangup_count=ycm_lead_daily_distribution.customer_hangup_count+${customerHangup}`;
  await sql`UPDATE ycm_leads SET call_attempts=call_attempts+1,calls_received=calls_received+${connected},calls_missed=calls_missed+${missed},last_call_outcome=${outcome},last_call_at=NOW(),last_contacted_at=NOW(),status=CASE WHEN ${outcome}='connected' AND status IN ('new','qualified','assigned') THEN 'contacted' ELSE status END,updated_at=NOW() WHERE lead_id=${leadId}`;
  return NextResponse.json({success:true,call:row});
 }catch{return NextResponse.json({success:false,code:'CALL_LOG_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
