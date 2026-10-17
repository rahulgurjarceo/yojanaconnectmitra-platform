import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {timingSafeEqual} from 'node:crypto';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const jsonObject=(v:unknown)=>v===undefined||v===null||(typeof v==='object'&&!Array.isArray(v));
const jsonSizeOk=(v:unknown)=>{try{return JSON.stringify(v??{}).length<=32768}catch{return false}};
function authorized(r:NextRequest){const configured=process.env.YCM_TELEMETRY_WEBHOOK_SECRET||'';const supplied=r.headers.get('x-ycm-webhook-secret')||'';if(!configured||!supplied)return false;const a=Buffer.from(configured),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b)}
export async function POST(r:NextRequest){
 if(!authorized(r))return NextResponse.json({success:false,code:'WEBHOOK_UNAUTHORIZED'},{status:401});
 const b=await r.json().catch(()=>null);
 if(!b?.event||!b?.provider||!b?.employeeUserId)return NextResponse.json({success:false,code:'WEBHOOK_REQUIRED_FIELDS'},{status:400});
 if(!jsonObject(b.metadata)||!jsonSizeOk(b.metadata))return NextResponse.json({success:false,code:'TELEMETRY_METADATA_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  if(b.event==='call'){
   if(!['inbound','outbound'].includes(b.direction)||!b.status||!b.startedAt)return NextResponse.json({success:false,code:'CALL_EVENT_INVALID'},{status:400});
   const row=(await sql`INSERT INTO ycm_employee_calls(employee_user_id,provider,provider_call_id,direction,status,started_at,ended_at,duration_seconds,contact_ref,recording_ref,metadata) VALUES(${b.employeeUserId},${b.provider},${b.providerCallId||null},${b.direction},${b.status},${b.startedAt},${b.endedAt||null},${b.durationSeconds??null},${b.contactRef||null},${b.recordingRef||null},${b.metadata||{}}::jsonb) ON CONFLICT(provider,provider_call_id) WHERE provider_call_id IS NOT NULL DO UPDATE SET status=EXCLUDED.status,ended_at=EXCLUDED.ended_at,duration_seconds=EXCLUDED.duration_seconds,metadata=EXCLUDED.metadata RETURNING call_id`)[0];
   return NextResponse.json({success:true,type:'call',id:row.call_id});
  }
  if(b.event==='message'){
   if(!['inbound','outbound'].includes(b.direction)||!b.status)return NextResponse.json({success:false,code:'MESSAGE_EVENT_INVALID'},{status:400});
   const row=(await sql`INSERT INTO ycm_employee_messages(employee_user_id,provider,provider_message_id,direction,status,recipient_ref,sent_at,template_ref,metadata) VALUES(${b.employeeUserId},${b.provider},${b.providerMessageId||null},${b.direction},${b.status},${b.recipientRef||null},${b.sentAt||new Date().toISOString()},${b.templateRef||null},${b.metadata||{}}::jsonb) ON CONFLICT(provider,provider_message_id) WHERE provider_message_id IS NOT NULL DO UPDATE SET status=EXCLUDED.status,metadata=EXCLUDED.metadata RETURNING message_id`)[0];
   return NextResponse.json({success:true,type:'message',id:row.message_id});
  }
  return NextResponse.json({success:false,code:'UNSUPPORTED_TELEMETRY_EVENT'},{status:400});
 }catch(e){return NextResponse.json({success:false,code:'TELEMETRY_INGEST_FAILED'},{status:500})}finally{await sql.end({timeout:3})}
}
