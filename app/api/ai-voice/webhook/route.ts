import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {createHmac,timingSafeEqual} from 'node:crypto';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function POST(r:NextRequest){
 const secret=process.env.YCM_VOICE_WEBHOOK_SECRET||'',signature=r.headers.get('x-ycm-voice-signature')||'';
 const raw=await r.text();if(!secret||!signature)return NextResponse.json({success:false,code:'SIGNATURE_REQUIRED'},{status:401});
 const expected=createHmac('sha256',secret).update(raw).digest('hex');
 const a=Buffer.from(expected),b=Buffer.from(signature.replace(/^sha256=/,''));
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({success:false,code:'SIGNATURE_INVALID'},{status:401});
 const bdy=JSON.parse(raw) as Record<string,unknown>,jobId=String(bdy.jobId||''),callId=String(bdy.callId||''),outcome=String(bdy.outcome||'');
 if(!jobId||!callId||!['answered','no_answer','busy','failed','completed','opt_out','callback_requested','interested','not_interested'].includes(outcome))return NextResponse.json({success:false,code:'WEBHOOK_PAYLOAD_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const job=(await sql`SELECT job_id,lead_id,campaign_id,provider_call_id FROM ycm_ai_voice_call_jobs WHERE job_id=${jobId} LIMIT 1`)[0];
  if(!job||job.provider_call_id!==callId)return NextResponse.json({success:false,code:'CALL_REFERENCE_MISMATCH'},{status:404});
  const interested=outcome==='interested'||bdy.interested===true;
  const status=['no_answer','busy','failed'].includes(outcome)?'failed':'completed';
  await sql`UPDATE ycm_ai_voice_call_jobs SET status=${status},outcome=${outcome},transcript=${String(bdy.transcript||'').slice(0,12000)||null},summary=${String(bdy.summary||'').slice(0,2000)||null},interested=${interested},callback_at=${bdy.callbackAt?new Date(String(bdy.callbackAt)):null},completed_at=NOW(),updated_at=NOW() WHERE job_id=${jobId}`;
  if(outcome==='opt_out')await sql`UPDATE ycm_ai_contact_preferences SET consent_status='withdrawn',do_not_contact=true,withdrawn_at=NOW(),updated_at=NOW() WHERE lead_id=${job.lead_id} AND channel='voice'`;
  await sql`INSERT INTO ycm_ai_voice_audit_events(job_id,campaign_id,lead_id,event_type,metadata) VALUES(${jobId},${job.campaign_id},${job.lead_id},'provider_call_completed',${JSON.stringify({outcome,interested})}::jsonb)`;
  return NextResponse.json({success:true});
 }catch{return NextResponse.json({success:false,code:'WEBHOOK_PROCESSING_FAILED'},{status:400})}finally{await sql.end({timeout:3})}
}
