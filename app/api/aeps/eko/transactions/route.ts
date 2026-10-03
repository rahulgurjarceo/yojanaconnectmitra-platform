import postgres from 'postgres';
import {randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
import {EkoAepsProvider} from '../../../../lib/eko-aeps';
import {recordSuccessfulFinancialTransaction,reverseFinancialTransaction} from '../../../../lib/ycm-financial-ledger';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};
function ref(){return ('Y'+randomBytes(12).toString('hex')).slice(0,20).toUpperCase();}
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as {transactionType?:'cash_withdrawal'|'balance_enquiry'|'mini_statement'|'aadhaar_to_aadhaar_transfer';amountPaise?:number;customerMobile?:string;bankCode?:string;aadhaarEncrypted?:string;pidData?:string;latLong?:string;sourceIp?:string;notifyCustomer?:0|1}|null;
 if(!b?.transactionType||!Number.isInteger(b.amountPaise)||b.amountPaise<0||!b.customerMobile||!b.bankCode||!b.aadhaarEncrypted||!b.pidData||!b.latLong||!b.sourceIp)return NextResponse.json({success:false,code:'EKO_AEPS_FIELDS_REQUIRED'},{status:400});
 if(b.transactionType==='cash_withdrawal'&&(b.amountPaise<5000||b.amountPaise%5000!==0))return NextResponse.json({success:false,code:'AEPS_AMOUNT_MUST_BE_MULTIPLE_OF_50'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const user=(await sql.unsafe('SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1',[s.sub]))[0];if(!user)return NextResponse.json({success:false,code:'USER_NOT_FOUND'},{status:404});
  const account=(await sql.unsafe('SELECT eko_user_code,status FROM ycm_eko_retailer_accounts WHERE user_id=$1 LIMIT 1',[user.id]))[0];if(!account)return NextResponse.json({success:false,code:'EKO_RETAILER_NOT_BOUND'},{status:409});if(account.status!=='active')return NextResponse.json({success:false,code:'EKO_RETAILER_NOT_ACTIVE'},{status:409});
  const clientRef=ref();
  const tx=(await sql.unsafe('INSERT INTO ycm_eko_aeps_transactions(user_id,eko_user_code,client_ref_id,transaction_type,amount_paise,customer_mobile,bank_code) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING eko_transaction_id,client_ref_id,status',[user.id,account.eko_user_code,clientRef,b.transactionType,b.amountPaise,b.customerMobile,b.bankCode]))[0];
  const provider=new EkoAepsProvider();
  const result=await provider.initiate({transactionId:clientRef,partnerUserId:s.sub,transactionType:b.transactionType,amountPaise:b.amountPaise,metadata:{ekoUserCode:account.eko_user_code},providerCode:'EKO',providerTransactionId:undefined,aadhaarEncrypted:b.aadhaarEncrypted,pidData:b.pidData,bankCode:b.bankCode,customerMobile:b.customerMobile,latLong:b.latLong,sourceIp:b.sourceIp,notifyCustomer:b.notifyCustomer??0});
  const status=result.state==='success'?'success':result.state==='failed'?'failed':result.state==='reversed'?'reversed':'provider_processing';
  const saved=(await sql.unsafe('UPDATE ycm_eko_aeps_transactions SET status=$1,eko_tid=$2,provider_message=$3,provider_payload=$4::jsonb,final_at=CASE WHEN $1 IN (\'success\',\'failed\',\'reversed\') THEN NOW() ELSE final_at END WHERE eko_transaction_id=$5 RETURNING *',[status,result.providerReference??null,result.message??null,JSON.stringify(result.metadata??{}),tx.eko_transaction_id]))[0];
  if(status==='success')await recordSuccessfulFinancialTransaction({externalReference:'aeps:'+clientRef,transactionType:'aeps',serviceCode:'FIN_AEPS',agentUserId:s.sub,providerCode:'EKO',providerTransactionId:result.providerReference,grossAmountPaise:b.amountPaise});
  if(status==='reversed')await reverseFinancialTransaction('aeps:'+clientRef).catch(()=>null);
  return NextResponse.json({success:true,transaction:saved,providerState:result.state});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'EKO_AEPS_INITIATION_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}