import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const roles=new Set(['employee','team_lead','branch_manager','management','ceo','admin']);
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const leadId=new URL(r.url).searchParams.get('leadId')?.trim();if(!leadId)return NextResponse.json({success:false,code:'LEAD_ID_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const lead=(await sql`SELECT lead_id,service_code,need_text,family_id FROM ycm_leads WHERE lead_id=${leadId} LIMIT 1`)[0];if(!lead)return NextResponse.json({success:false,code:'LEAD_NOT_FOUND'},{status:404});
  const existing=(await sql`SELECT service_code FROM ycm_lead_cross_sell_recommendations WHERE lead_id=${leadId} AND status IN ('recommended','offered','interested') ORDER BY score DESC`);
  if(existing.length===0){
   const services=await sql`SELECT s.service_code,s.service_name,s.service_type,s.business_domain_code
     FROM ycm_service_master s WHERE s.status='active' AND s.service_code<>COALESCE(${lead.service_code},'')
     ORDER BY CASE
       WHEN s.business_domain_code='loans-finance-insurance' THEN 100
       WHEN s.business_domain_code='documents-certificates' THEN 95
       WHEN s.business_domain_code='government-services-schemes' THEN 90
       WHEN s.business_domain_code='education-skilling' THEN 85 ELSE 50 END DESC,s.service_name LIMIT 8`;
   for(const v of services){
    const reason=v.business_domain_code==='documents-certificates'?'Related document need':v.business_domain_code==='loans-finance-insurance'?'Financial/insurance opportunity':v.business_domain_code==='government-services-schemes'?'Government scheme opportunity':'Relevant YCM service opportunity';
    await sql`INSERT INTO ycm_lead_cross_sell_recommendations(lead_id,service_code,score,reason) VALUES(${leadId},${v.service_code},${v.business_domain_code==='documents-certificates'?95:v.business_domain_code==='loans-finance-insurance'?90:75},${reason}) ON CONFLICT(lead_id,service_code) DO NOTHING`;
   }
  }
  const rows=await sql`SELECT r.recommendation_id,r.service_code,s.service_name,s.service_type,s.business_domain_code,r.score,r.reason,r.status
    FROM ycm_lead_cross_sell_recommendations r JOIN ycm_service_master s ON s.service_code=r.service_code
    WHERE r.lead_id=${leadId} AND r.status IN ('recommended','offered','interested') ORDER BY r.score DESC LIMIT 10`;
  return NextResponse.json({success:true,lead, recommendations:rows});
 }catch{return NextResponse.json({success:false,code:'CROSS_SELL_LOAD_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json().catch(()=>({})) as Record<string,unknown>,id=String(b.recommendationId||'').trim(),status=String(b.status||'').trim();
  if(!id||!['offered','interested','rejected','converted','dismissed'].includes(status))return NextResponse.json({success:false,code:'CROSS_SELL_UPDATE_INVALID'},{status:400});
  const row=(await sql`UPDATE ycm_lead_cross_sell_recommendations SET status=${status},updated_at=NOW() WHERE recommendation_id=${id} RETURNING *`)[0];
  if(!row)return NextResponse.json({success:false,code:'RECOMMENDATION_NOT_FOUND'},{status:404});
  await sql`INSERT INTO ycm_lead_events(lead_id,event_type,details) VALUES(${row.lead_id},'cross_sell_status',${JSON.stringify({recommendationId:id,status})}::jsonb)`;
  return NextResponse.json({success:true,recommendation:row});
 }catch{return NextResponse.json({success:false,code:'CROSS_SELL_UPDATE_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}