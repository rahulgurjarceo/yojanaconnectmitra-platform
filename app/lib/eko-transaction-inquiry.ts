import {ekoSecurityHeaders} from './eko-aeps';

function env(name:string){const value=process.env[name];if(!value)throw new Error(name+'_NOT_CONFIGURED');return value;}

export type EkoInquiryResult={txStatus:string;providerReference?:string;bankReference?:string;message?:string;raw:unknown};

export async function inquireEkoAepsTransaction(input:{clientRefId?:string;tid?:string;ekoUserCode:string}):Promise<EkoInquiryResult>{
 if(!input.clientRefId&&!input.tid)throw new Error('EKO_INQUIRY_REFERENCE_REQUIRED');
 if(!input.ekoUserCode)throw new Error('EKO_RETAILER_USER_CODE_REQUIRED');
 const timestamp=Date.now().toString();
 const security=ekoSecurityHeaders(timestamp);
 const query=new URLSearchParams({initiator_id:env('EKO_INITIATOR_ID'),user_code:input.ekoUserCode,...(input.tid?{tid:input.tid}:{client_ref_id:String(input.clientRefId)})});
 const response=await fetch(env('EKO_BASE_URL')+'/ekoapi/v3/tools/reference/transaction?'+query.toString(),{method:'GET',headers:{developer_key:env('EKO_DEVELOPER_KEY'),'secret-key':security.secretKey,'secret-key-timestamp':security.secretKeyTimestamp}});
 const raw=await response.json().catch(()=>null) as {data?:{tx_status?:string|number;tid?:string;bank_ref_num?:string;reason?:string};tx_status?:string|number;message?:string}|null;
 if(!response.ok)throw new Error('EKO_INQUIRY_HTTP_'+response.status);
 const data=raw?.data??raw;
 return {txStatus:String(data?.tx_status??''),providerReference:data?.tid,bankReference:data?.bank_ref_num,message:data?.reason||raw?.message,raw};
}