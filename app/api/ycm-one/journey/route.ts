import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { verifySession, sessionCookieName } from '../../lib/ycm-access-control';

export const runtime = 'nodejs';
const db = () => { const u=process.env.DATABASE_URL||process.env.POSTGRES_URL; return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null; };
const privileged=(role:string)=>['ceo','admin','management'].includes(role);
function allowed(s:ReturnType<typeof verifySession>, familyId:string){ return !!s&&(privileged(s.role)||s.familyId===familyId); }

export async function POST(request:NextRequest){
 const session=verifySession(request.cookies.get(sessionCookieName())?.value);
 if(!session)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const familyId=String(body?.familyId||session.familyId||'').trim();
 const domain=String(body?.domainCode||'').trim();
 const needText=String(body?.needText||'').trim();
 const serviceCode=String(body?.serviceCode||'').trim().toUpperCase();
 const locationId=String(body?.locationId||'').trim();
 const lat=Number(body?.latitude), lon=Number(body?.longitude);
 const memberId=String(body?.memberId||'').trim();
 if(!familyId||!domain||!needText)return NextResponse.json({success:false,code:'FAMILY_DOMAIN_AND_NEED_REQUIRED'},{status:400});
 if(!allowed(session,familyId))return NextResponse.json({success:false,code:'FAMILY_ACCESS_DENIED'},{status:403});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const domainRow=(await sql`SELECT domain_code,name,icon,pillar,description FROM ycm_business_domains WHERE domain_code=${domain} AND status='active' LIMIT 1`)[0] as Record<string,unknown>|undefined;
  if(!domainRow)return NextResponse.json({success:false,code:'DOMAIN_NOT_FOUND'},{status:404});
  const family=(await sql`SELECT family_id,state_code,district_code,block_code FROM ycm_families WHERE family_id=${familyId} LIMIT 1`)[0] as Record<string,unknown>|undefined;
  if(!family)return NextResponse.json({success:false,code:'FAMILY_NOT_FOUND'},{status:404});
  const member=memberId?(await sql`SELECT member_id FROM ycm_family_members WHERE family_id=${familyId} AND member_id=${memberId} LIMIT 1`)[0]:null;
  if(memberId&&!member)return NextResponse.json({success:false,code:'MEMBER_NOT_FOUND'},{status:404});
  const service=serviceCode?(await sql`SELECT service_code,service_name,service_type,business_domain_code,requires_documents,requires_provider FROM ycm_service_master WHERE service_code=${serviceCode} AND status='active' LIMIT 1`)[0] as Record<string,unknown>|undefined:null;
  if(serviceCode && String(service?.business_domain_code||'')!==domain)return NextResponse.json({success:false,code:'SERVICE_DOMAIN_MISMATCH'},{status:409});
  const caseId=crypto.randomUUID();
  await sql`INSERT INTO ycm_family_cases(case_id,family_id,member_id,case_category_id,case_category_name,sub_service,status,need_text,location_id,next_action)
    VALUES(${caseId},${familyId},${memberId||null},${domain},${String(domainRow.name)},${serviceCode||null},'new',${needText},${locationId||null},'discover_service')`;
  const serviceFilter = serviceCode ? sql`AND service_code=${serviceCode}` : sql``;
  const services=await sql`SELECT service_code,service_name,service_type,requires_documents,requires_provider,channel FROM ycm_service_master WHERE status='active' AND business_domain_code=${domain} ${serviceFilter} ORDER BY service_name LIMIT 20`;
  const selectedService=serviceCode?service:(services[0] as Record<string,unknown>|undefined);
  const selectedCode=String(selectedService?.service_code||'');
  const requirements=selectedCode?await sql`SELECT requirement_type,document_type,condition,member_condition,priority,source_name,source_url FROM ycm_requirement_rules WHERE status='active' AND service_code=${selectedCode} AND (state_code IS NULL OR state_code=${String(family.state_code||'')}) ORDER BY priority,requirement_type,document_type`:[];
  let providers:unknown[]=[];
  if(selectedCode){
   if(Number.isFinite(lat)&&Number.isFinite(lon)){
    providers=await sql`SELECT p.provider_id,p.provider_code,p.provider_name,p.provider_type,p.capabilities,p.status,p.latitude,p.longitude,sp.priority,sp.enabled,
      (6371*acos(LEAST(1,GREATEST(-1,cos(radians(${lat}))*cos(radians(p.latitude))*cos(radians(p.longitude)-radians(${lon}))+sin(radians(${lat}))*sin(radians(p.latitude)))))) AS distance_km
      FROM ycm_service_providers p JOIN ycm_service_provider_links sp ON sp.provider_id=p.provider_id
      WHERE sp.service_code=${selectedCode} AND sp.enabled=true AND p.status='active' AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      ORDER BY distance_km,sp.priority,p.provider_name LIMIT 10`;
   }else{
    providers=await sql`SELECT p.provider_id,p.provider_code,p.provider_name,p.provider_type,p.capabilities,p.status,p.latitude,p.longitude,sp.priority,sp.enabled
      FROM ycm_service_providers p JOIN ycm_service_provider_links sp ON sp.provider_id=p.provider_id
      WHERE sp.service_code=${selectedCode} AND sp.enabled=true AND p.status='active' AND (${locationId}='' OR p.location_id=${locationId})
      ORDER BY sp.priority,p.provider_name LIMIT 10`;
   }
  }
  await sql`UPDATE ycm_family_cases SET next_action=${providers.length?'review_provider_and_requirements':selectedCode?'review_requirements_and_application':'select_service'},updated_at=NOW() WHERE case_id=${caseId}`;
  return NextResponse.json({success:true,journey:{caseId,domain:domainRow,need:{text:needText},location:locationId||(Number.isFinite(lat)&&Number.isFinite(lon)?{latitude:lat,longitude:lon}:null),services,selectedService,eligibility:{ruleCount:requirements.length,rules:requirements,note:'Configured rules are guidance; final eligibility/approval remains with the competent authority/provider.'},providers,stages:['need_captured','location_resolved','service_discovered','eligibility_checked','documents_checked','application_or_referral','case_tracking','follow_up','outcome'],existingEngines:{documents:'/api/service-applications',caseOperations:'/api/case-operations',dispatch:'/api/operations/case-dispatch',requirements:'/api/family-requirements/evaluate'}}},{status:201,headers:{'Cache-Control':'private,no-store'}});
 }catch(error){console.error('universal journey failed',error);return NextResponse.json({success:false,code:'UNIVERSAL_JOURNEY_FAILED'},{status:500});
 }finally{await sql.end({timeout:3});}
}

export async function GET(request:NextRequest){
 const session=verifySession(request.cookies.get(sessionCookieName())?.value); if(!session)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const caseId=new URL(request.url).searchParams.get('caseId')?.trim()||''; if(!caseId)return NextResponse.json({success:false,code:'CASE_ID_REQUIRED'},{status:400});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const c=(await sql`SELECT case_id,family_id,member_id,case_category_id,case_category_name,sub_service,status,need_text,location_id,provider_id,application_id,referral_status,next_action,priority,due_at,assigned_to,escalated_at,outcome_code,outcome_notes,outcome_at,csat_score,csat_comment,created_at,updated_at FROM ycm_family_cases WHERE case_id=${caseId} LIMIT 1`)[0] as Record<string,unknown>|undefined;
  if(!c)return NextResponse.json({success:false,code:'CASE_NOT_FOUND'},{status:404});
  if(!allowed(session,String(c.family_id)))return NextResponse.json({success:false,code:'CASE_ACCESS_DENIED'},{status:403});
  return NextResponse.json({success:true,journey:c},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3});}
}
