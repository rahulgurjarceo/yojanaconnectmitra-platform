import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const actor=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const manage=(role:string)=>['ceo','management','admin','employee','team_lead'].includes(role);
function secretAllowed(r:NextRequest){const configured=process.env.YCM_LEAD_WEBHOOK_SECRET;return !!configured&&r.headers.get('x-ycm-lead-secret')===configured;}
async function actorId(sql:ReturnType<typeof postgres>,userId:string){return (await sql`SELECT id FROM ycm_users WHERE user_id=${userId} LIMIT 1`)[0]?.id||null;}

export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!manage(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const u=new URL(r.url),status=u.searchParams.get('status'),service=u.searchParams.get('serviceCode'),assigned=s.role==='employee'?s.sub:null;
  const rows=assigned
   ?await sql`SELECT l.*,sm.service_name FROM ycm_leads l LEFT JOIN ycm_service_master sm ON sm.service_code=l.service_code JOIN ycm_users au ON au.id=l.assigned_to WHERE au.user_id=${assigned} AND (${status} IS NULL OR l.status=${status}) ORDER BY l.updated_at DESC LIMIT 500`
   :await sql`SELECT l.*,sm.service_name FROM ycm_leads l LEFT JOIN ycm_service_master sm ON sm.service_code=l.service_code WHERE (${status} IS NULL OR l.status=${status}) AND (${service} IS NULL OR l.service_code=${service}) ORDER BY l.updated_at DESC LIMIT 500`;
  return NextResponse.json({success:true,leads:rows});
 }finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const s=actor(r),machine=secretAllowed(r);
 if(!s&&!machine)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json();const name=String(b.name||'').trim(),need=String(b.needText||'').trim();
  if(!name)return NextResponse.json({success:false,code:'NAME_REQUIRED'},{status:400});
  const serviceCode=String(b.serviceCode||'').trim().toUpperCase()||null;
  if(serviceCode){const ok=(await sql`SELECT 1 FROM ycm_service_master WHERE service_code=${serviceCode} AND status='active' LIMIT 1`)[0];if(!ok)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:400});}
  const source=String(b.source||'manual').trim().slice(0,40);
  const row=(await sql`INSERT INTO ycm_leads(family_id,member_id,source,name,mobile,email,state_code,district_code,block_code,village_code,need_text,service_code,status,next_follow_up_at,metadata)
   VALUES(${b.familyId||null},${b.memberId||null},${source},${name},${b.mobile||null},${b.email||null},${b.stateCode||null},${b.districtCode||null},${b.blockCode||null},${b.villageCode||null},${need||null},${serviceCode},${serviceCode?'qualified':'new'},${b.nextFollowUpAt||null},${b.metadata||{}}) RETURNING *`)[0];
  let matches:unknown[]=[];
  if(!serviceCode&&need){
   matches=await sql`SELECT service_code,service_name,business_domain_code,CASE WHEN lower(service_name) LIKE '%'||lower(${need})||'%' THEN 100 ELSE 50 END AS match_score FROM ycm_service_master WHERE status='active' AND (service_name ILIKE '%'||${need}||'%' OR service_code ILIKE '%'||${need}||'%') ORDER BY match_score DESC,service_name LIMIT 10`;
   for(const m of matches)await sql`INSERT INTO ycm_lead_service_matches(lead_id,service_code,match_score,reason) VALUES(${row.lead_id},${(m as {service_code:string}).service_code},${(m as {match_score:number}).match_score},'text_match') ON CONFLICT DO NOTHING`;
  }
  if(s){const uid=await actorId(sql,s.sub);await sql`INSERT INTO ycm_lead_events(lead_id,actor_user_id,event_type,details) VALUES(${row.lead_id},${uid},'created',${JSON.stringify({source})}::jsonb)`;}else await sql`INSERT INTO ycm_lead_events(lead_id,event_type,details) VALUES(${row.lead_id},'created_external',${JSON.stringify({source})}::jsonb)`;
  return NextResponse.json({success:true,lead:row,serviceMatches:matches},{status:201});
 }catch(e){return NextResponse.json({success:false,code:'LEAD_CREATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});}finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!manage(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json().catch(()=>null) as {leadId?:string;status?:string;assignedTo?:string|null;nextFollowUpAt?:string|null;serviceCode?:string|null;convertToCase?:boolean;familyId?:string|null;memberId?:string|null}|null;
  if(!b?.leadId)return NextResponse.json({success:false,code:'LEAD_ID_REQUIRED'},{status:400});
  const lead=(await sql`SELECT * FROM ycm_leads WHERE lead_id=${b.leadId} LIMIT 1`)[0];
  if(!lead)return NextResponse.json({success:false,code:'LEAD_NOT_FOUND'},{status:404});
  const uid=await actorId(sql,s.sub);

  if(b.convertToCase){
   if(!['ceo','management','admin','team_lead'].includes(s.role))return NextResponse.json({success:false,code:'LEAD_CONVERSION_FORBIDDEN'},{status:403});
   const familyId=b.familyId||lead.family_id;
   if(!familyId)return NextResponse.json({success:false,code:'FAMILY_REQUIRED_FOR_CASE_CONVERSION'},{status:400});
   const family=(await sql`SELECT family_id FROM ycm_families WHERE family_id=${familyId} LIMIT 1`)[0];
   if(!family)return NextResponse.json({success:false,code:'FAMILY_NOT_FOUND'},{status:400});
   const memberId=b.memberId||lead.member_id||null;
   if(memberId){const member=(await sql`SELECT member_id FROM ycm_family_members WHERE member_id=${memberId} AND family_id=${familyId} LIMIT 1`)[0];if(!member)return NextResponse.json({success:false,code:'MEMBER_NOT_IN_FAMILY'},{status:400});}
   const serviceCode=b.serviceCode||lead.service_code||((await sql`SELECT service_code FROM ycm_lead_service_matches WHERE lead_id=${lead.lead_id} ORDER BY match_score DESC,created_at ASC LIMIT 1`)[0]?.service_code)||null;
   if(!serviceCode)return NextResponse.json({success:false,code:'SERVICE_REQUIRED_FOR_CASE_CONVERSION'},{status:400});
   const service=(await sql`SELECT service_code,service_name FROM ycm_service_master WHERE service_code=${serviceCode} AND status='active' LIMIT 1`)[0];
   if(!service)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:400});
   const result=await sql.begin(async tx=>{
    const caseRow=(await tx`INSERT INTO ycm_family_cases(case_id,family_id,member_id,case_category_id,case_category_name,sub_service,status,service_code)
      VALUES(gen_random_uuid(),${familyId},${memberId},${service.service_code},${service.service_name},${lead.need_text||null},'new',${service.service_code}) RETURNING *`)[0];
    const updated=(await tx`UPDATE ycm_leads SET family_id=${familyId},member_id=${memberId},service_code=${service.service_code},status='converted',updated_at=NOW() WHERE lead_id=${lead.lead_id} RETURNING *`)[0];
    await tx`INSERT INTO ycm_lead_events(lead_id,actor_user_id,event_type,details) VALUES(${lead.lead_id},${uid},'converted_to_case',${JSON.stringify({caseId:caseRow.case_id,serviceCode:service.service_code,familyId})}::jsonb)`;
    return {caseRow,updated};
   });
   return NextResponse.json({success:true,lead:result.updated,case:result.caseRow},{status:201});
  }

  let assignedTo=lead.assigned_to;
  if(b.assignedTo!==undefined){
   if(!['ceo','management','admin','team_lead'].includes(s.role))return NextResponse.json({success:false,code:'ASSIGNMENT_ACCESS_DENIED'},{status:403});
   assignedTo=b.assignedTo?((await sql`SELECT id FROM ycm_users WHERE user_id=${b.assignedTo} AND role IN ('employee','team_lead','management','admin') AND status='active' LIMIT 1`)[0]?.id||null):null;
   if(b.assignedTo&& !assignedTo)return NextResponse.json({success:false,code:'ASSIGNEE_NOT_FOUND'},{status:400});
  }
  const serviceCode=b.serviceCode===undefined?lead.service_code:(b.serviceCode?b.serviceCode.toUpperCase():null);
  if(serviceCode){const ok=(await sql`SELECT 1 FROM ycm_service_master WHERE service_code=${serviceCode} AND status='active' LIMIT 1`)[0];if(!ok)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:400});}
  const status=b.status||lead.status;
  const allowedStatuses=['new','qualified','contacted','follow_up','converted','closed','lost'];
  if(!allowedStatuses.includes(status))return NextResponse.json({success:false,code:'LEAD_STATUS_INVALID'},{status:400});
  const updated=(await sql`UPDATE ycm_leads SET status=${status},assigned_to=${assignedTo},next_follow_up_at=${b.nextFollowUpAt===undefined?lead.next_follow_up_at:b.nextFollowUpAt},service_code=${serviceCode},updated_at=NOW() WHERE lead_id=${lead.lead_id} RETURNING *`)[0];
  await sql`INSERT INTO ycm_lead_events(lead_id,actor_user_id,event_type,details) VALUES(${lead.lead_id},${uid},'updated',${JSON.stringify({status,assignedTo,serviceCode})}::jsonb)`;
  return NextResponse.json({success:true,lead:updated});
 }catch(e){return NextResponse.json({success:false,code:'LEAD_UPDATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});}finally{await sql.end({timeout:3});}
}