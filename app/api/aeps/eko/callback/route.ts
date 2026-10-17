import {createHmac,timingSafeEqual} from 'node:crypto';
import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {recordSuccessfulFinancialTransaction,reverseFinancialTransaction} from '../../../../lib/ycm-financial-ledger';

export const runtime='nodejs';

function db(){const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null;}
function signature(raw:string){const secret=process.env.EKO_CALLBACK_SECRET;if(!secret)throw new Error('EKO_CALLBACK_SECRET_NOT_CONFIGURED');return createHmac('sha256',secret).update(raw).digest('hex');}
function validSignature(raw:string,provided:string){const expected=signature(raw);const a=Buffer.from(expected,'utf8');const b=Buffer.from(provided,'utf8');return a.length===b.length&&timingSafeEqual(a,b);}
function mapStatus(v:string){if(v==='0'||v==='success')return 'success';if(v==='1'||v==='failed')return 'failed';if(v==='4'||v==='reversed')return 'reversed';return 'inquiry_required';}
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
  const tx=(await sql.unsafe('SELECT * FROM ycm_eko_aeps_transactions WHERE client_ref_id=$1 LIMIT 1',[clientRef]))[0];
  if(!tx)return NextResponse.json({success:false,code:'TRANSACTION_NOT_FOUND'},{status:404});
  const nextStatus=mapStatus(String(body?.tx_status??body?.status??''));
  const applyLedgerForTerminalStatus=async(status:string,transaction:Record<string,unknown>)=>{
   if(status==='success')await recordSuccessfulFinancialTransaction({externalReference:'aeps:'+clientRef,transactionType:'aeps',serviceCode:'FIN_AEPS',agentUserId:String(transaction.user_id),providerCode:'EKO',providerTransactionId:body?.tid?String(body.tid):undefined,grossAmountPaise:Number(transaction.amount_paise)});
   if(status==='reversed')await reverseFinancialTransaction('aeps:'+clientRef).catch(e=>{if(!(e instanceof Error)||e.message!=='TRANSACTION_NOT_FOUND')throw e;});
  };
  const existingStatus=String(tx.status??'');
  if(terminal.has(existingStatus)&&!(existingStatus==='success'&&nextStatus==='reversed')){
   await applyLedgerForTerminalStatus(existingStatus,tx);
   return NextResponse.json({success:true,idempotent:true,status:existingStatus});
  }
  const saved=(await sql.unsafe(
   "UPDATE ycm_eko_aeps_transactions SET status=CASE WHEN status IN ('success','failed','reversed') AND NOT (status='success' AND $1='reversed') AND status<>$1 THEN status ELSE $1 END,eko_tid=COALESCE($2,eko_tid),bank_reference=COALESCE($3,bank_reference),provider_message=COALESCE($4,provider_message),provider_payload=provider_payload || $5::jsonb,final_at=CASE WHEN status='success' AND $1='reversed' THEN NOW() WHEN status IN ('success','failed','reversed') THEN final_at WHEN $1 IN ('success','failed','reversed') THEN NOW() ELSE final_at END,updated_at=NOW() WHERE eko_transaction_id=$6 RETURNING *",
   [nextStatus,body?.tid??null,body?.bank_ref_num??null,body?.message??body?.reason??null,JSON.stringify({legacyEkoCallback:body}),tx.eko_transaction_id]
  ))[0];
  const persistedStatus=String(saved?.status??'');
  if(terminal.has(persistedStatus)){
   await applyLedgerForTerminalStatus(persistedStatus,saved);
   if(persistedStatus!==nextStatus)return NextResponse.json({success:true,idempotent:true,status:persistedStatus});
  }
  return NextResponse.json({success:true,idempotent:false,status:persistedStatus||nextStatus});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'CALLBACK_PROCESSING_FAILED'},{status:500});}finally{await sql.end({timeout:3});}
}
