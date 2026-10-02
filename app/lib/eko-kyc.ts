import {ekoSecurityHeaders} from './eko-aeps';
function env(name:string){const value=process.env[name];if(!value)throw new Error(name+'_NOT_CONFIGURED');return value;}
async function call(path:string,method:'GET'|'POST'|'PUT',body?:unknown){
 const timestamp=Date.now().toString();const security=ekoSecurityHeaders(timestamp);
 const response=await fetch(env('EKO_BASE_URL')+path,{method,headers:{'Content-Type':'application/json',developer_key:env('EKO_DEVELOPER_KEY'),'secret-key':security.secretKey,'secret-key-timestamp':security.secretKeyTimestamp},body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await response.json().catch(()=>null);if(!response.ok)throw new Error('EKO_KYC_HTTP_'+response.status);return raw;
}
export const ekoPanVerify=(input:{userCode:string;pan:string})=>call('/ekoapi/v3/tools/kyc/touras/pan-verification','POST',{initiator_id:env('EKO_INITIATOR_ID'),user_code:input.userCode,pan_number:input.pan});
export const ekoBankVerify=(input:{userCode:string;account:string;ifsc:string;clientRefId:string})=>call('/ekoapi/v3/tools/kyc/bank-account/sync','POST',{initiator_id:env('EKO_INITIATOR_ID'),user_code:input.userCode,bank_account:input.account,ifsc:input.ifsc,source:'API',client_ref_id:input.clientRefId});
export const ekoBankVerifyPennyless=(input:{userCode:string;account:string;ifsc:string})=>call('/ekoapi/v3/tools/kyc/touras/bank-acc-verify-pennyless','POST',{initiator_id:env('EKO_INITIATOR_ID'),user_code:input.userCode,account:input.account,ifsc:input.ifsc});
export const ekoMerchantKycOtpVerify=(input:{userCode:string;mobile:string;otp:string;otpRefId:string})=>call('/ekoapi/v3/tools/kyc/mobile/otp/verify','PUT',{initiator_id:env('EKO_INITIATOR_ID'),user_code:input.userCode,mobile:input.mobile,otp:input.otp,otp_ref_id:input.otpRefId});
