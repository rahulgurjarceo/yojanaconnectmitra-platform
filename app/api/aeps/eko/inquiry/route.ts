import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
import {inquireEkoAepsTransaction} from '../../../../lib/eko-transaction-inquiry';
import {recordSuccessfulFinancialTransaction,reverseFinancialTransaction} from '../../../../lib/ycm-financial-ledger';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:8,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const map=(s:string)=>s==='0'?'success':s==='1'?'failed':s==='3'||s==='4'?'reversed':'inquiry_required';
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as {clientRefId?:string;tid?:string}|null;if(!b?.clientRefId&&!b?.tid)return NextResponse.json({success:false,code:'INQUIRY_REFERENCE_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const user=(await sql.unsafe('SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1',[s.sub]))[0];if(!user)return NextResponse.json({success:false,code:'USER_NOT_FOUND'},{status:404});
  const tx=(await sql.unsafe('SELECT * FROM ycm_eko_aeps_transactions WHERE '+(b.clientRefId?'client_ref_id=$1':'eko_tid=$1')+' AND user_id=$2 LIMIT 1',[b.clientRefId??b.tid,user.id]))[0];
  if(!tx)return NextResponse.json({success:false,code:'EKO_TRANSACTION_NOT_FOUND'},{status:404});
  const result=await inquireEkoAepsTransaction({clientRefId:b.clientRefId,tid:b.tid??tx.eko_tid,ekoUserCode:tx.eko_user_code});
  const status=map(result.txStatus);
  const saved=(await sql.unsafe('UPDATE ycm_eko_aeps_transactions SET status=$1,eko_tid=COALESCE($2,eko_tid),bank_reference=COALESCE($3,bank_reference),provider_message=$4,provider_payload=provider_payload || $5::jsonb,last_inquired_at=NOW(),final_at=CASE WHEN $1 IN (\'success\',\'failed\',\'reversed\') THEN NOW() ELSE final_at END WHERE eko_transaction_id=$6 RETURNING *',[status,result.providerReference??null,result.bankReference??null,result.message??null,JSON.stringify({inquiry:result.raw}),tx.eko_transaction_id]))[0];
  if(status==='success')await recordSuccessfulFinancialTransaction({externalReference:'aeps:'+tx.client_ref_id,transactionType:'aeps',serviceCode:'FIN_AEPS',agentUserId:tx.user_id,providerCode:'EKO',providerTransactionId:result.providerReference,grossAmountPaise:tx.amount_paise});
  if(status==='reversed')await reverseFinancialTransaction('aeps:'+tx.client_ref_id).catch(()=>null);
  return NextResponse.json({success:true,status,transaction:saved});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'EKO_INQUIRY_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}