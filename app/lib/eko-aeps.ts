import {createHmac} from 'node:crypto';
import postgres from 'postgres';
import type {YcmAepsProvider,YcmAepsRequest,YcmAepsResult,YcmAepsTransactionType} from './ycm-aeps';

const SERVICE_TYPE:Partial<Record<YcmAepsTransactionType,number>>={cash_withdrawal:2,balance_enquiry:3,mini_statement:4};

function env(name:string){const value=process.env[name];if(!value)throw new Error(name+'_NOT_CONFIGURED');return value;}

export function ekoSecurityHeaders(timestamp=Date.now().toString()){
 const accessKey=env('EKO_ACCESS_KEY');
 const encodedKey=Buffer.from(accessKey,'utf8').toString('base64');
 const secretKey=createHmac('sha256',Buffer.from(encodedKey,'utf8')).update(timestamp).digest('base64');
 return {secretKey,secretKeyTimestamp:timestamp,encodedKey};
}

export function ekoRequestHash(timestamp:string,values:string[]){
 const accessKey=env('EKO_ACCESS_KEY');
 const encodedKey=Buffer.from(accessKey,'utf8').toString('base64');
 return createHmac('sha256',Buffer.from(encodedKey,'utf8')).update(timestamp+values.join('')).digest('base64');
}

function mapState(txStatus:string|number|undefined):YcmAepsResult['state']{
 const v=String(txStatus??'');
 if(v==='0')return 'success';
 if(v==='1')return 'failed';
 if(v==='2')return 'inquiry_required';
 return 'inquiry_required';
}

export type EkoAepsInput=YcmAepsRequest&{
 aadhaarEncrypted:string;
 aadhaarForRequestHash:string;
 pidData:string;
 bankCode:string;
 customerMobile:string;
 latLong:string;
 sourceIp:string;
 notifyCustomer?:0|1;
};

export class EkoAepsProvider implements YcmAepsProvider{
 async initiate(request:YcmAepsRequest):Promise<YcmAepsResult>{
  const input=request as EkoAepsInput;
  const timestamp=Date.now().toString();
  const security=ekoSecurityHeaders(timestamp);
  const amount=input.transactionType==='balance_enquiry'||input.transactionType==='mini_statement'?'0':String(Math.round((input.amountPaise??0)/100));
  const userCode=String(input.metadata?.ekoUserCode??'');if(!userCode)throw new Error('EKO_RETAILER_USER_CODE_REQUIRED');
  const body={
   service_type:SERVICE_TYPE[input.transactionType]??(()=>{throw new Error('EKO_AEPS_TRANSACTION_TYPE_UNSUPPORTED');})(),
   initiator_id:env('EKO_INITIATOR_ID'),
   user_code:userCode,
   customer_id:input.customerMobile,
   bank_code:input.bankCode,
   amount,
   client_ref_id:input.transactionId,
   pipe:'0',
   notify_customer:String(input.notifyCustomer??0),
   aadhar:input.aadhaarEncrypted,
   piddata:input.pidData,
   latlong:input.latLong,
   source_ip:input.sourceIp,
  };
  if(!/^\d{12}$/.test(input.aadhaarForRequestHash))throw new Error('EKO_AADHAAR_HASH_VALUE_INVALID');
  // EKO's documented AePS request_hash sequence is timestamp + plaintext Aadhaar + amount + user_code.
  // This value is transient and is deliberately excluded from the provider body and all persistence.
  const hashValues=[input.aadhaarForRequestHash,amount,userCode];
  const requestHash=ekoRequestHash(timestamp,hashValues);
  const response=await fetch(env('EKO_BASE_URL')+'/ekoapi/v2/aeps',{
   method:'POST',
   headers:{'Content-Type':'application/json',developer_key:env('EKO_DEVELOPER_KEY'),'secret-key':security.secretKey,'secret-key-timestamp':security.secretKeyTimestamp,request_hash:requestHash},
   body:JSON.stringify(body),
  });
  const payload=await response.json().catch(()=>null) as {data?:{tx_status?:string;tid?:string;reason?:string;bank_ref_num?:string};message?:string}|null;
  if(!response.ok)throw new Error('EKO_HTTP_'+response.status);
  return {state:mapState(payload?.data?.tx_status),providerReference:payload?.data?.tid||payload?.data?.bank_ref_num,message:payload?.data?.reason||payload?.message,metadata:{txStatus:payload?.data?.tx_status,bankReference:payload?.data?.bank_ref_num}};
 }

 async status(transactionId:string):Promise<YcmAepsResult>{
  if(!transactionId)throw new Error('EKO_TRANSACTION_ID_REQUIRED');
  const databaseUrl=process.env.DATABASE_URL||process.env.POSTGRES_URL;
  if(!databaseUrl)throw new Error('DATABASE_NOT_CONFIGURED');
  const sql=postgres(databaseUrl,{max:1,prepare:false,connect_timeout:10,idle_timeout:5});
  try{
   const row=(await sql.unsafe(
    'SELECT client_ref_id,eko_tid,eko_user_code FROM ycm_eko_aeps_transactions WHERE client_ref_id=$1 OR eko_tid=$1 OR eko_transaction_id::text=$1 LIMIT 1',
    [transactionId]
   ))[0];
   if(!row)throw new Error('EKO_TRANSACTION_NOT_FOUND');
   if(!row.eko_user_code)throw new Error('EKO_RETAILER_USER_CODE_REQUIRED');
   // Load lazily to avoid a module-initialization cycle: the inquiry adapter uses
   // ekoSecurityHeaders from this module.
   const {inquireEkoAepsTransaction}=await import('./eko-transaction-inquiry');
   const result=await inquireEkoAepsTransaction({
    ...(row.eko_tid?{tid:String(row.eko_tid)}:{clientRefId:String(row.client_ref_id)}),
    ekoUserCode:String(row.eko_user_code)
   });
   return {
    state:mapState(result.txStatus),
    providerReference:result.providerReference||result.bankReference,
    message:result.message,
    metadata:{txStatus:result.txStatus,bankReference:result.bankReference}
   };
  }finally{await sql.end({timeout:3});}
 }
}
