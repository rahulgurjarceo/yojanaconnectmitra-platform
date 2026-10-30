import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {timingSafeEqual} from 'node:crypto';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
function authorized(r:NextRequest){const a=Buffer.from(process.env.YCM_AI_VOICE_WORKER_SECRET||''),b=Buffer.from(r.headers.get('x-ycm-ai-voice-worker-secret')||'');return a.length>=32&&a.length===b.length&&timingSafeEqual(a,b)}
export async function POST(r:NextRequest){
 if(!authorized(r))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 if(process.env.YCM_VOICE_LIVE_ENABLED!=='true')return NextResponse.json({success:false,code:'LIVE_CALLING_DISABLED',message:'Set YCM_VOICE_LIVE_ENABLED=true only after provider and compliance checks.'},{status:423});
 const endpoint=process.env.YCM_VOICE_PROVIDER_API_URL||'',token=process.env.YCM_VOICE_PROVIDER_API_TOKEN||'';
 if(!endpoint||!token)return NextResponse.json({success:false,code:'VOICE_PROVIDER_NOT_CONFIGURED'},{status:503});
 try{const u=new URL(endpoint);if(u.protocol!=='https:'&&process.env.NODE_ENV==='production')return NextResponse.json({success:false,code:'HTTPS_PROVIDER_REQUIRED'},{status:503});}catch{return NextResponse.json({success:false,code:'VOICE_PROVIDER_URL_INVALID'},{status:503})}
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const limit=Math.max(1,Math.min(10,Number((await r.json().catch(()=>({}))).limit||3)));
  const candidates=await sql`SELECT j.job_id,j.lead_id,j.campaign_id,j.idempotency_key,c.campaign_name,c.script_key,c.language_codes,c.daily_call_limit,c.start_hour,c.end_hour,c.timezone,l.name,l.mobile,l.service_code,l.need_text,p.consent_status,p.do_not_contact FROM ycm_ai_voice_call_jobs j JOIN ycm_ai_voice_campaigns c ON c.campaign_id=j.campaign_id JOIN ycm_leads l ON l.lead_id=j.lead_id JOIN ycm_ai_contact_preferences p ON p.lead_id=l.lead_id AND p.channel='voice' WHERE j.status='queued' AND c.status='active' AND p.consent_status='granted' AND p.do_not_contact=false AND l.mobile IS NOT NULL ORDER BY j.scheduled_at ASC LIMIT ${limit}`;
  let submitted=0,suppressed=0,failed=0;
  for(const job of candidates){
   const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:job.timezone,hour:'2-digit',hourCycle:'h23'}).format(new Date()));
   if(hour<job.start_hour||hour>=job.end_hour){continue}
   const daily=Number((await sql`SELECT COUNT(*)::int n FROM ycm_ai_voice_call_jobs WHERE campaign_id=${job.campaign_id} AND status IN ('calling','completed') AND started_at >= date_trunc('day',NOW() AT TIME ZONE ${job.timezone}) AT TIME ZONE ${job.timezone}`)[0]?.n||0);
   if(daily>=job.daily_call_limit)continue;
   const claimed=await sql`UPDATE ycm_ai_voice_call_jobs SET status='calling',started_at=NOW(),attempt_count=attempt_count+1,updated_at=NOW() WHERE job_id=${job.job_id} AND status='queued' AND EXISTS(SELECT 1 FROM ycm_ai_contact_preferences p WHERE p.lead_id=${job.lead_id} AND p.channel='voice' AND p.consent_status='granted' AND p.do_not_contact=false) RETURNING job_id`;
   if(!claimed.length){suppressed++;continue}
   try{
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token,'idempotency-key':job.idempotency_key},body:JSON.stringify({to:job.mobile,customerName:job.name,scriptKey:job.script_key,languages:job.language_codes,serviceCode:job.service_code,needText:job.need_text,callbackUrl:process.env.YCM_VOICE_WEBHOOK_URL||null,metadata:{jobId:job.job_id,campaignId:job.campaign_id,leadId:job.lead_id}}),signal:AbortSignal.timeout(15000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.callId){await sql`UPDATE ycm_ai_voice_call_jobs SET status='failed',last_error_code=${'PROVIDER_HTTP_'+response.status},completed_at=NOW(),updated_at=NOW() WHERE job_id=${job.job_id}`;failed++;continue}
    await sql`UPDATE ycm_ai_voice_call_jobs SET provider_code=${process.env.YCM_VOICE_PROVIDER||'configured_provider'},provider_call_id=${String(data.callId).slice(0,160)},updated_at=NOW() WHERE job_id=${job.job_id}`;
    await sql`INSERT INTO ycm_ai_voice_audit_events(job_id,campaign_id,lead_id,event_type,metadata) VALUES(${job.job_id},${job.campaign_id},${job.lead_id},'provider_call_submitted',${JSON.stringify({provider:process.env.YCM_VOICE_PROVIDER||'configured_provider'})}::jsonb)`;
    submitted++;
   }catch{await sql`UPDATE ycm_ai_voice_call_jobs SET status='failed',last_error_code='PROVIDER_REQUEST_FAILED',completed_at=NOW(),updated_at=NOW() WHERE job_id=${job.job_id}`;failed++}
  }
  return NextResponse.json({success:true,submitted,suppressed,failed,checked:candidates.length});
 }finally{await sql.end({timeout:3})}
}
