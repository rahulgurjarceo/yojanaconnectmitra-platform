import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const managers=new Set(['ceo','admin','management','team_lead','branch_manager']);
const actor=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const str=(v:unknown,n=160)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=n?v.trim():null;
export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!managers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const campaigns=await sql`SELECT c.*,COUNT(j.job_id)::int AS queued_total,COUNT(j.job_id) FILTER(WHERE j.status='completed')::int AS completed_total,COUNT(j.job_id) FILTER(WHERE j.status='failed')::int AS failed_total FROM ycm_ai_voice_campaigns c LEFT JOIN ycm_ai_voice_call_jobs j ON j.campaign_id=c.campaign_id GROUP BY c.campaign_id ORDER BY c.created_at DESC LIMIT 50`;
  const leads=await sql`SELECT l.lead_id,l.name,l.mobile,l.service_code,l.status,l.source,l.created_at,COALESCE(p.consent_status,'unknown') AS voice_consent,COALESCE(p.do_not_contact,false) AS do_not_contact FROM ycm_leads l LEFT JOIN ycm_ai_contact_preferences p ON p.lead_id=l.lead_id AND p.channel='voice' WHERE l.status NOT IN ('converted','lost','closed') ORDER BY l.created_at DESC LIMIT 150`;
  const providerReady=Boolean(process.env.YCM_VOICE_PROVIDER_API_URL&&process.env.YCM_VOICE_PROVIDER_API_TOKEN&&process.env.YCM_VOICE_WEBHOOK_SECRET);
  return NextResponse.json({success:true,campaigns,leads,providerReady,liveCallingEnabled:providerReady&&process.env.YCM_VOICE_LIVE_ENABLED==='true'},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3})}
}
export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!managers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json().catch(()=>({})) as Record<string,unknown>,action=str(b.action,32);
  if(action==='create_campaign'){
   const name=str(b.campaignName,160),script=str(b.scriptKey,120),service=str(b.serviceCode,120);
   const langs=Array.isArray(b.languageCodes)?b.languageCodes.filter(x=>typeof x==='string'&&/^[a-z]{2}(-[A-Z]{2})?$/.test(x)).slice(0,5):['hi-IN'];
   const daily=Math.max(1,Math.min(5000,Number(b.dailyCallLimit||100))),attempts=Math.max(1,Math.min(5,Number(b.maxAttempts||2)));
   const start=Math.max(0,Math.min(23,Number(b.startHour??10))),end=Math.max(1,Math.min(24,Number(b.endHour??18)));
   if(!name||!script||end<=start)return NextResponse.json({success:false,code:'CAMPAIGN_INPUT_INVALID'},{status:400});
   const row=(await sql`INSERT INTO ycm_ai_voice_campaigns(campaign_name,service_code,script_key,language_codes,daily_call_limit,max_attempts,start_hour,end_hour,status,created_by) VALUES(${name},${service},${script},${sql.array(langs)},${daily},${attempts},${start},${end},'draft',${s.sub}) RETURNING *`)[0];
   return NextResponse.json({success:true,campaign:row},{status:201});
  }
  if(action==='set_consent'){
   const leadId=str(b.leadId,120),status=str(b.consentStatus,16),source=str(b.consentSource,80),reference=str(b.consentReference,160);
   if(!leadId||!['granted','withdrawn','unknown'].includes(status))return NextResponse.json({success:false,code:'CONSENT_INPUT_INVALID'},{status:400});
   const lead=(await sql`SELECT lead_id FROM ycm_leads WHERE lead_id=${leadId} LIMIT 1`)[0];if(!lead)return NextResponse.json({success:false,code:'LEAD_NOT_FOUND'},{status:404});
   if(status==='granted'&&(!source||!reference))return NextResponse.json({success:false,code:'CONSENT_EVIDENCE_REQUIRED'},{status:400});
   const row=(await sql`INSERT INTO ycm_ai_contact_preferences(lead_id,channel,consent_status,consent_source,consent_reference,consented_at,withdrawn_at,do_not_contact,updated_by) VALUES(${leadId},'voice',${status},${source},${reference},CASE WHEN ${status}='granted' THEN NOW() ELSE NULL END,CASE WHEN ${status}='withdrawn' THEN NOW() ELSE NULL END,${status}!=='granted',${s.sub}) ON CONFLICT(lead_id,channel) DO UPDATE SET consent_status=EXCLUDED.consent_status,consent_source=EXCLUDED.consent_source,consent_reference=EXCLUDED.consent_reference,consented_at=EXCLUDED.consented_at,withdrawn_at=EXCLUDED.withdrawn_at,do_not_contact=EXCLUDED.do_not_contact,updated_by=EXCLUDED.updated_by,updated_at=NOW() RETURNING *`)[0];
   await sql`INSERT INTO ycm_ai_voice_audit_events(lead_id,event_type,actor_user_id,metadata) VALUES(${leadId},'voice_consent_updated',${s.sub},${JSON.stringify({status,source,reference})}::jsonb)`;
   return NextResponse.json({success:true,preference:row});
  }
  if(action==='enqueue'){
   const campaignId=str(b.campaignId,120),leadIds=Array.isArray(b.leadIds)?Array.from(new Set(b.leadIds.filter(x=>typeof x==='string').slice(0,250))):[];
   if(!campaignId||!leadIds.length)return NextResponse.json({success:false,code:'CAMPAIGN_AND_LEADS_REQUIRED'},{status:400});
   const campaign=(await sql`SELECT * FROM ycm_ai_voice_campaigns WHERE campaign_id=${campaignId} LIMIT 1`)[0];if(!campaign)return NextResponse.json({success:false,code:'CAMPAIGN_NOT_FOUND'},{status:404});
   if(!['draft','scheduled','active'].includes(campaign.status))return NextResponse.json({success:false,code:'CAMPAIGN_NOT_QUEUEABLE'},{status:409});
   let queued=0,suppressed=0;
   for(const leadId of leadIds){
    const lead=(await sql`SELECT l.lead_id,l.mobile,l.service_code,p.consent_status,p.do_not_contact FROM ycm_leads l LEFT JOIN ycm_ai_contact_preferences p ON p.lead_id=l.lead_id AND p.channel='voice' WHERE l.lead_id=${leadId} LIMIT 1`)[0];
    if(!lead||!lead.mobile||lead.consent_status!=='granted'||lead.do_not_contact){suppressed++;continue}
    if(campaign.service_code&&lead.service_code!==campaign.service_code){suppressed++;continue}
    const key='ycm-voice:'+campaignId+':'+leadId;
    const inserted=await sql`INSERT INTO ycm_ai_voice_call_jobs(campaign_id,lead_id,status,idempotency_key) VALUES(${campaignId},${leadId},'queued',${key}) ON CONFLICT(campaign_id,lead_id) DO NOTHING RETURNING job_id`;
    if(inserted.length){queued++;await sql`INSERT INTO ycm_ai_voice_audit_events(job_id,campaign_id,lead_id,event_type,actor_user_id) VALUES(${inserted[0].job_id},${campaignId},${leadId},'call_job_queued',${s.sub})`;}
   }
   return NextResponse.json({success:true,queued,suppressed,requested:leadIds.length});
  }
  if(action==='set_status'){
   const campaignId=str(b.campaignId,120),status=str(b.status,16);
   if(!campaignId||!['active','paused','cancelled'].includes(status))return NextResponse.json({success:false,code:'CAMPAIGN_STATUS_INVALID'},{status:400});
   const row=(await sql`UPDATE ycm_ai_voice_campaigns SET status=${status},updated_at=NOW() WHERE campaign_id=${campaignId} RETURNING *`)[0];
   if(!row)return NextResponse.json({success:false,code:'CAMPAIGN_NOT_FOUND'},{status:404});
   return NextResponse.json({success:true,campaign:row});
  }
  return NextResponse.json({success:false,code:'ACTION_INVALID'},{status:400});
 }catch(e){return NextResponse.json({success:false,code:'AI_VOICE_REQUEST_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
