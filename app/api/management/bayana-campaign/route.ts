import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../../lib/ycm-access-control';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const roles = new Set(['team_lead','branch_manager','management','ceo','admin']);
const db = () => { const u=process.env.DATABASE_URL||process.env.POSTGRES_URL; return u?postgres(u,{max:5,prepare:false,connect_timeout:8}):null; };
function auth(r:NextRequest){const s=verifySession(r.cookies.get(sessionCookieName())?.value);return s&&roles.has(s.role)?s:null;}

export async function GET(r:NextRequest){
 const s=auth(r);if(!s)return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const c=await sql`SELECT campaign_id,campaign_name,target_households,target_registrations,status FROM ycm_campaigns WHERE campaign_code='BAYANA-F360-2026' LIMIT 1`;
  if(!c[0])return NextResponse.json({success:false,code:'CAMPAIGN_NOT_CONFIGURED'},{status:404});
  const id=c[0].campaign_id;
  const [h,v,t,g,cp,recent]=await Promise.all([
   sql`SELECT COUNT(*)::int households_contacted,COUNT(*) FILTER(WHERE family360_status='registered')::int registered,COUNT(*) FILTER(WHERE family360_status='interested')::int interested,COUNT(*) FILTER(WHERE family360_status='follow_up')::int follow_up FROM ycm_campaign_households WHERE campaign_id=${id}`,
   sql`SELECT COUNT(*)::int total_visits,COUNT(*) FILTER(WHERE visited_at::date=CURRENT_DATE)::int visits_today,COUNT(*) FILTER(WHERE outcome='registered')::int registrations_from_visits FROM ycm_campaign_visits WHERE campaign_id=${id}`,
   sql`SELECT t.team_id,t.team_code,t.team_name,t.zone_name,t.status,COUNT(DISTINCT m.employee_user_id)::int members FROM ycm_campaign_teams t LEFT JOIN ycm_campaign_team_members m ON m.team_id=t.team_id AND m.active=true WHERE t.campaign_id=${id} GROUP BY t.team_id ORDER BY t.team_code`,
   sql`SELECT COUNT(*)::int total_villages,COUNT(*) FILTER(WHERE status='completed')::int completed_villages,COUNT(*) FILTER(WHERE status='in_progress')::int active_villages FROM ycm_campaign_villages WHERE campaign_id=${id}`,
   sql`SELECT COUNT(*)::int total_camps,COUNT(*) FILTER(WHERE status='completed')::int completed_camps,COUNT(*) FILTER(WHERE status='planned')::int planned_camps FROM ycm_campaign_camps WHERE campaign_id=${id}`,
   sql`SELECT h.household_ref,h.head_name,h.family_size,h.family360_status,h.source,h.created_at,v.village_name FROM ycm_campaign_households h LEFT JOIN ycm_campaign_villages v ON v.village_id=h.village_id WHERE h.campaign_id=${id} ORDER BY h.created_at DESC LIMIT 10`
  ]);
  return NextResponse.json({success:true,campaign:c[0],households:h[0],visits:v[0],teams:t,villages:g[0],camps:cp[0],recent});
 }catch{return NextResponse.json({success:false,code:'CAMPAIGN_DASHBOARD_LOAD_FAILED'},{status:500});}
 finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=auth(r);if(!s)return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json();const head=String(b.headName||'').trim().slice(0,120),ref=String(b.householdRef||'').trim().slice(0,64),vcode=String(b.villageCode||'').trim().slice(0,32);
  const mobile=String(b.mobile||'').replace(/\D/g,'').slice(-10),size=Number(b.familySize||1),source=b.source==='camp'?'camp':'doorstep';
  const outcome=String(b.outcome||'contacted'),status=String(b.family360Status||'not_registered'),consent=b.contactConsent===true;
  if(!head||!ref||!vcode)return NextResponse.json({success:false,code:'REQUIRED_FIELDS_MISSING'},{status:400});
  if(!Number.isInteger(size)||size<1||size>30)return NextResponse.json({success:false,code:'FAMILY_SIZE_INVALID'},{status:400});
  if(mobile&&mobile.length!==10)return NextResponse.json({success:false,code:'MOBILE_INVALID'},{status:400});
  if(mobile&&!consent)return NextResponse.json({success:false,code:'CONTACT_CONSENT_REQUIRED'},{status:400});
  if(!['contacted','registered','interested','follow_up','not_available','not_interested'].includes(outcome)||!['not_registered','interested','registered','follow_up','not_interested'].includes(status))return NextResponse.json({success:false,code:'STATUS_INVALID'},{status:400});
  const result=await sql.begin(async tx=>{
   const c=await tx`SELECT campaign_id FROM ycm_campaigns WHERE campaign_code='BAYANA-F360-2026' AND status IN('pilot','active') LIMIT 1`;
   if(!c[0])throw new Error('CAMPAIGN_NOT_ACTIVE');
   const village=await tx`SELECT village_id FROM ycm_campaign_villages WHERE campaign_id=${c[0].campaign_id} AND village_code=${vcode} LIMIT 1`;
   if(!village[0])throw new Error('VILLAGE_NOT_FOUND');
   const h=await tx`INSERT INTO ycm_campaign_households(campaign_id,village_id,household_ref,head_name,contact_mobile,family_size,contact_consent,family360_status,source,created_by)
    VALUES(${c[0].campaign_id},${village[0].village_id},${ref},${head},${consent?mobile||null:null},${size},${consent},${status},${source},${s.sub})
    ON CONFLICT(campaign_id,household_ref) DO UPDATE SET head_name=EXCLUDED.head_name,family_size=EXCLUDED.family_size,family360_status=EXCLUDED.family360_status,updated_at=NOW() RETURNING household_id`;
   await tx`INSERT INTO ycm_campaign_visits(campaign_id,household_id,visit_type,outcome,service_interest,notes,visited_by)
    VALUES(${c[0].campaign_id},${h[0].household_id},${source},${outcome},${String(b.serviceInterest||'').slice(0,120)||null},${String(b.notes||'').slice(0,500)||null},${s.sub})`;
   return {householdId:h[0].household_id};
  });
  return NextResponse.json({success:true,...result},{status:201});
 }catch(e){const msg=e instanceof Error?e.message:'';const code=['CAMPAIGN_NOT_ACTIVE','VILLAGE_NOT_FOUND'].includes(msg)?msg:'HOUSEHOLD_SAVE_FAILED';return NextResponse.json({success:false,code},{status:code==='VILLAGE_NOT_FOUND'?404:400});}
 finally{await sql.end({timeout:3});}
}
