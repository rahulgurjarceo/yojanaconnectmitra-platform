import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {ekoRequestHash,ekoSecurityHeaders} from '../../../../lib/eko-aeps';
import {recordSuccessfulFinancialTransaction,reverseFinancialTransaction} from '../../../../lib/ycm-financial-ledger';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:8,prepare:false,connect_timeout:10,idle_timeout:20}):null};
type Detail={client_ref_id?:string;request_hash_params?:string[];data?:Record<string,unknown>;response?:{data?:Record<string,unknown>;message?:string}};
const finalStatus=(v:string)=>v==='0'?'success':v==='1'?'failed':v==='3'||v==='4'?'reversed':'inquiry_required';
export async function OPTIONS(){return new NextResponse(null,{status:204,headers:{'Access-Control-Allow-Origin':'https://stagegateway.eko.in','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});}
export async function POST(r:NextRequest){
 const body=await r.json().catch(()=>null) as {action?:string;detail?:Detail}|null;
 const detail=body?.detail;
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  if(body?.action==='debit-hook'){
   const clientRef=String(detail?.client_ref_id??'');const data=detail?.data??{};const userCode=String(data.user_code??'');const amount=Number(data.amount??0);
   if(!clientRef||!userCode)return NextResponse.json({action:'go',allow:false,message:'Missing transaction reference or retailer'});
   const account=(await sql.unsafe('SELECT user_id,status FROM ycm_eko_retailer_accounts WHERE eko_user_code=$1 LIMIT 1',[userCode]))[0];
   const tx=(await sql.unsafe('SELECT eko_transaction_id,user_id,eko_user_code,amount_paise,status FROM ycm_eko_aeps_transactions WHERE client_ref_id=$1 LIMIT 1',[clientRef]))[0];
   if(!account||account.status!=='active'||!tx||String(tx.user_id)!==String(account.user_id)||String(tx.eko_user_code)!==userCode)return NextResponse.json({action:'go',allow:false,message:'Retailer or transaction is not authorized'});
   if(tx.amount_paise!==Math.round(amount*100))return NextResponse.json({action:'go',allow:false,message:'Transaction amount mismatch'});
   const params=(detail?.request_hash_params??[]).map(k=>String(data[k]??''));
   const timestamp=Date.now().toString();const security=ekoSecurityHeaders(timestamp);const requestHash=ekoRequestHash(timestamp,params);
   await sql.unsafe('UPDATE ycm_eko_aeps_transactions SET status=CASE WHEN status=\'initiated\' THEN \'provider_processing\' ELSE status END,provider_payload=provider_payload || $1::jsonb,updated_at=NOW() WHERE eko_transaction_id=$2',[JSON.stringify({debitHook:body}),tx.eko_transaction_id]);
   return NextResponse.json({action:'go',allow:true,secret_key_timestamp:security.secretKeyTimestamp,request_hash:requestHash,secret_key:security.secretKey},{headers:{'Access-Control-Allow-Origin':'https://stagegateway.eko.in'}});
  }
  if(body?.action!=='eko-response')return NextResponse.json({success:false,code:'EKO_CALLBACK_ACTION_UNSUPPORTED'},{status:400});
  const clientRef=String(detail?.client_ref_id??'');const data=detail?.response?.data??{};if(!clientRef)return NextResponse.json({success:false,code:'EKO_CLIENT_REF_REQUIRED'},{status:400});
  const tx=(await sql.unsafe('SELECT * FROM ycm_eko_aeps_transactions WHERE client_ref_id=$1 LIMIT 1',[clientRef]))[0];if(!tx)return NextResponse.json({success:false,code:'EKO_TRANSACTION_NOT_FOUND'},{status:404});
  const account=(await sql.unsafe('SELECT status,eko_user_code FROM ycm_eko_retailer_accounts WHERE user_id=$1 LIMIT 1',[tx.user_id]))[0];
  if(!account||account.eko_user_code!==tx.eko_user_code)return NextResponse.json({success:false,code:'EKO_RETAILER_BINDING_INVALID'},{status:409});
  const providerStatus=String(data.tx_status??'');const status=finalStatus(providerStatus);const amount=Number(data.amount??0);
  if(tx.amount_paise!==Math.round(amount*100)&&tx.transaction_type==='cash_withdrawal')return NextResponse.json({success:false,code:'EKO_CALLBACK_AMOUNT_MISMATCH'},{status:409});
  const saved=(await sql.unsafe('UPDATE ycm_eko_aeps_transactions SET status=$1,eko_tid=COALESCE($2,eko_tid),bank_reference=COALESCE($3,bank_reference),provider_message=$4,provider_payload=provider_payload || $5::jsonb,final_at=CASE WHEN $1 IN (\'success\',\'failed\',\'reversed\') THEN NOW() ELSE final_at END,updated_at=NOW() WHERE eko_transaction_id=$6 RETURNING *',[status,data.tid??null,data.bank_ref_num??null,String(detail?.response?.message??data.reason??''),JSON.stringify({ekoResponse:body}),tx.eko_transaction_id]))[0];
  if(status==='success')await recordSuccessfulFinancialTransaction({externalReference:'aeps:'+clientRef,transactionType:'aeps',serviceCode:'FIN_AEPS',agentUserId:tx.user_id,providerCode:'EKO',providerTransactionId:data.tid?String(data.tid):undefined,grossAmountPaise:tx.amount_paise});
  if(status==='reversed')await reverseFinancialTransaction('aeps:'+clientRef).catch(()=>null);
  return NextResponse.json({success:true,status,transaction:saved});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'EKO_CALLBACK_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}