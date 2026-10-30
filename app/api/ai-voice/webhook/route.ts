import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function POST(r:NextRequest){
 const secret=process.env.YCM_VOICE_WEBHOOK_SECRET||'',signature=r.headers.get('x-ycm-voice-signature')||'',raw=await r.text();
 if(secret.length<32||!signature)return NextResponse.json({success:false,code:'SIGNATURE_REQUIRED'},{status:401});
 const expected=Buffer.from(createHmac('sha256',secret).update(raw).digest('hex')),actual=Buffer.from(signature.replace(/^sha256=/,''));
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return NextResponse.json({success:false,code:'SIGNATURE_INVALID'},{status:401});
 let b:Record<string,unknown>;try{b=JSON.parse(raw) as Record<string,unknown>}catch{return NextResponse.json({success:false,code:'WEBHOOK_JSON_INVALID'},{status:400})}
 const jobId=String(b.jobId||''),callId=String(b.callId||''),outcome=String(b.outcome||''),allowed=['answered','no_answer','busy','failed','completed','opt_out','callback_requested','interested','not_interested'];
 if(!jobId||!callId||!allowed.includes(outcome))return NextResponse.json({success:false,code:'WEBHOOK_PAYLOAD_INVALID'},{status:400});
 const callbackDate=b.callbackAt?new Date(String(b.callbackAt)):null;if(callbackDate&&!Number.isFinite(callbackDate.getTime()))return NextResponse.json({success:false,code:'CALLBACK_DATE_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const provider=(process.env.YCM_VOICE_PROVIDER||'configured_provider').slice(0,40),eventId=String(b.eventId||createHash('sha256').update(raw).digest('hex')).slice(0,200),payloadHash=createHash('sha256').update(raw).digest('hex'),interested=outcome==='interested'||b.interested===true,nextStatus=['no_answer','busy','failed'].includes(outcome)?'failed':'completed';
 try{
  const result=await sql.begin(async tx=>{
   const receipt=await tx`INSERT INTO ycm_ai_voice_webhook_events(provider_code,provider_event_id,job_id,event_type,payload_sha256) VALUES(${provider},${eventId},${jobId},${outcome},${payloadHash}) ON CONFLICT(provider_code,provider_event_id) DO NOTHING RETURNING receipt_id`;
   if(!receipt.length)return 'duplicate';
   const job=(await tx`SELECT job_id,lead_id,campaign_id,provider_call_id,status FROM ycm_ai_voice_call_jobs WHERE job_id=${jobId} FOR UPDATE`)[0];
   if(!job||job.provider_call_id!==callId)throw new Error('CALL_REFERENCE_MISMATCH');
   if(outcome==='opt_out')await tx`UPDATE ycm_ai_contact_preferences SET consent_status='withdrawn',do_not_contact=true,withdrawn_at=NOW(),updated_at=NOW() WHERE lead_id=${job.lead_id} AND channel='voice'`;
   if(!['completed','failed','cancelled','suppressed'].includes(job.status)){
    await tx`UPDATE ycm_ai_voice_call_jobs SET status=${nextStatus},outcome=${outcome},transcript=${String(b.transcript||'').slice(0,12000)||null},summary=${String(b.summary||'').slice(0,2000)||null},interested=${interested},callback_at=${callbackDate},completed_at=NOW(),updated_at=NOW() WHERE job_id=${jobId}`;
    if(interested||outcome==='callback_requested'){
     const crmStatus=outcome==='callback_requested'?'follow_up':'contacted';
     await tx`UPDATE ycm_leads SET status=${crmStatus},next_follow_up_at=${callbackDate},last_contacted_at=NOW(),updated_at=NOW() WHERE lead_id=${job.lead_id}`;
     await tx`INSERT INTO ycm_lead_events(lead_id,event_type,details) VALUES(${job.lead_id},'ai_voice_interest',${JSON.stringify({outcome,interested,callbackAt:b.callbackAt||null})}::jsonb)`;
    }
   }
   await tx`INSERT INTO ycm_ai_voice_audit_events(job_id,campaign_id,lead_id,event_type,metadata) VALUES(${jobId},${job.campaign_id},${job.lead_id},'provider_call_webhook',${JSON.stringify({outcome,interested,providerEventId:eventId})}::jsonb)`;
   await tx`UPDATE ycm_ai_voice_webhook_events SET processed_at=NOW() WHERE provider_code=${provider} AND provider_event_id=${eventId}`;
   return 'processed';
  });
  return NextResponse.json({success:true,result});
 }catch(e){const code=e instanceof Error&&e.message==='CALL_REFERENCE_MISMATCH'?'CALL_REFERENCE_MISMATCH':'WEBHOOK_PROCESSING_FAILED';return NextResponse.json({success:false,code},{status:code==='CALL_REFERENCE_MISMATCH'?404:400})}
 finally{await sql.end({timeout:3})}
}
