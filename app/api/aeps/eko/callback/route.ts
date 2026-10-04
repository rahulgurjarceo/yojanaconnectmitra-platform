import {createHmac,timingSafeEqual} from 'node:crypto';
import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';

function db(){const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null;}
function signature(raw:string){const secret=process.env.EKO_CALLBACK_SECRET;if(!secret)throw new Error('EKO_CALLBACK_SECRET_NOT_CONFIGURED');return createHmac('sha256',secret).update(raw).digest('hex');}
function validSignature(raw:string,provided:string){const expected=signature(raw);const a=Buffer.from(expected,'utf8');const b=Buffer.from(provided,'utf8');return a.length===b.length&&timingSafeEqual(a,b);}
function mapStatus(v:string){if(v==='0'||v==='success')return 'success';if(v==='1'||v==='failed')return 'failed';if(v==='3'||v==='4'||v==='reversed')return 'reversed';return 'provider_processing';}
const terminal=new Set(['success','failed','reversed']);

export async function POST(request:NextRequest){
 const raw=await request.text();
 const provided=request.headers.get('x-eko-callback-signature')||'';
 if(!provided)return NextResponse.json({success:false,code:'CALLBACK_SIGNATURE_REQUIRED'},{status:401});
 try{if(!validSignature(raw,provided))return NextResponse.json({success:false,code:'CALLBACK_SIGNATURE_INVALID'},{status:401});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'CALLBACK_SECURITY_NOT_CONFIGURED'},{status:503});}
 let body:any;try{body=JSON.parse(raw);}catch{return NextResponse.json({success:false,code:'INVALID_JSON'},{status:400});}
 const clientRef=typeof body?.client_ref_id==='string'?body.client_ref_id.trim():'';
 if(!clientRef)return NextResponse.json({success:false,code:'CLIENT_REF_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const tx=(await sql.unsafe('SELECT eko_transaction_id,status FROM ycm_eko_aeps_transactions WHERE client_ref_id=$1 LIMIT 1',[clientRef]))[0];
  if(!tx)return NextResponse.json({success:false,code:'TRANSACTION_NOT_FOUND'},{status:404});
  const nextStatus=mapStatus(String(body?.tx_status??body?.status??''));
  if(terminal.has(tx.status))return NextResponse.json({success:true,idempotent:true,status:tx.status});
  const saved=(await sql.unsafe('UPDATE ycm_eko_aeps_transactions SET status=$1,eko_tid=COALESCE($2,eko_tid),bank_reference=COALESCE($3,bank_reference),provider_message=COALESCE($4,provider_message),provider_payload=$5::jsonb,final_at=CASE WHEN $1 IN (\'success\',\'failed\',\'reversed\') THEN NOW() ELSE final_at END WHERE eko_transaction_id=$6 AND status NOT IN (\'success\',\'failed\',\'reversed\') RETURNING status',[nextStatus,body?.tid??null,body?.bank_ref_num??null,body?.message??body?.reason??null,JSON.stringify(body),tx.eko_transaction_id]))[0];
  return NextResponse.json({success:true,idempotent:false,status:saved?.status??nextStatus});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'CALLBACK_PROCESSING_FAILED'},{status:500});}finally{await sql.end({timeout:3});}
}
