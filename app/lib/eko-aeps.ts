import {createHmac} from 'node:crypto';
import type {YcmAepsProvider,YcmAepsRequest,YcmAepsResult,YcmAepsTransactionType} from './ycm-aeps';

const SERVICE_TYPE:Partial<Record<YcmAepsTransactionType,number>>={cash_withdrawal:2,balance_enquiry:3,mini_statement:4,aadhaar_to_aadhaar_transfer:5};

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
 if(v==='2'||v==='5')return 'provider_processing';
 if(v==='3'||v==='4')return 'reversed';
 return 'provider_processing';
}

export type EkoAepsInput=YcmAepsRequest&{
 aadhaarEncrypted:string;
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
  const amount=String(Math.round((input.amountPaise??0)/100));
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
  const hashValues=input.transactionType==='cash_withdrawal'?[input.customerMobile,amount,userCode]:[input.customerMobile,userCode];
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
  throw new Error('EKO_AEPS_STATUS_REQUIRES_TRANSACTION_INQUIRY_ADAPTER');
 }
}
