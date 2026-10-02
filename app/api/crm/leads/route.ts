import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const actor=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const manage=(role:string)=>['ceo','management','admin','employee','team_lead'].includes(role);
function secretAllowed(r:NextRequest){const configured=process.env.YCM_LEAD_WEBHOOK_SECRET;return !!configured&&r.headers.get('x-ycm-lead-secret')===configured;}
export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!manage(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const u=new URL(r.url),status=u.searchParams.get('status'),service=u.searchParams.get('serviceCode'),assigned=s.role==='employee'?s.sub:null;
 const rows=assigned?await sql`SELECT l.*,sm.service_name FROM ycm_leads l LEFT JOIN ycm_service_master sm ON sm.service_code=l.service_code JOIN ycm_users au ON au.id=l.assigned_to WHERE au.user_id=${assigned} AND (${status} IS NULL OR l.status=${status}) ORDER BY l.updated_at DESC LIMIT 500`:await sql`SELECT l.*,sm.service_name FROM ycm_leads l LEFT JOIN ycm_service_master sm ON sm.service_code=l.service_code WHERE (${status} IS NULL OR l.status=${status}) AND (${service} IS NULL OR l.service_code=${service}) ORDER BY l.updated_at DESC LIMIT 500`;
 return NextResponse.json({success:true,leads:rows});}finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=actor(r),machine=secretAllowed(r);
 if(!s&&!machine)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json();const name=String(b.name||'').trim(),need=String(b.needText||'').trim();
  if(!name)return NextResponse.json({success:false,code:'NAME_REQUIRED'},{status:400});
  let serviceCode=String(b.serviceCode||'').trim().toUpperCase()||null;
  if(serviceCode){const ok=(await sql`SELECT 1 FROM ycm_service_master WHERE service_code=${serviceCode} AND status='active' LIMIT 1`)[0];if(!ok)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:400});}
  const source=String(b.source||'manual').trim().slice(0,40);
  const row=(await sql`INSERT INTO ycm_leads(family_id,member_id,source,name,mobile,email,state_code,district_code,block_code,village_code,need_text,service_code,status,next_follow_up_at,metadata)
   VALUES(${b.familyId||null},${b.memberId||null},${source},${name},${b.mobile||null},${b.email||null},${b.stateCode||null},${b.districtCode||null},${b.blockCode||null},${b.villageCode||null},${need||null},${serviceCode},${serviceCode?'qualified':'new'},${b.nextFollowUpAt||null},${b.metadata||{}}) RETURNING *`)[0];
  let matches:unknown[]=[];
  if(!serviceCode&&need){matches=await sql`SELECT service_code,service_name,business_domain_code,CASE WHEN lower(service_name) LIKE '%'||lower(${need})||'%' THEN 100 ELSE 50 END AS match_score FROM ycm_service_master WHERE status='active' AND (service_name ILIKE '%'||${need}||'%' OR service_code ILIKE '%'||${need}||'%') ORDER BY match_score DESC,service_name LIMIT 10`;for(const m of matches)await sql`INSERT INTO ycm_lead_service_matches(lead_id,service_code,match_score,reason) VALUES(${row.lead_id},${m.service_code},${m.match_score},'text_match') ON CONFLICT DO NOTHING`;}
  if(s){const uid=(await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0]?.id||null;await sql`INSERT INTO ycm_lead_events(lead_id,actor_user_id,event_type,details) VALUES(${row.lead_id},${uid},'created',${JSON.stringify({source})}::jsonb)`;}else await sql`INSERT INTO ycm_lead_events(lead_id,event_type,details) VALUES(${row.lead_id},'created_external',${JSON.stringify({source})}::jsonb)`;
  return NextResponse.json({success:true,lead:row,serviceMatches:matches},{status:201});
 }catch(e){return NextResponse.json({success:false,code:'LEAD_CREATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});}finally{await sql.end({timeout:3});}
}
