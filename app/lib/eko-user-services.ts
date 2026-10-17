import {ekoSecurityHeaders} from './eko-aeps';
function env(name:string){const value=process.env[name];if(!value)throw new Error(name+'_NOT_CONFIGURED');return value;}
export async function getEkoUserServices(ekoUserCode:string){
 if(!ekoUserCode)throw new Error('EKO_RETAILER_USER_CODE_REQUIRED');
 const timestamp=Date.now().toString();const security=ekoSecurityHeaders(timestamp);
 const q=new URLSearchParams({initiator_id:env('EKO_INITIATOR_ID'),user_code:ekoUserCode});
 const response=await fetch(env('EKO_BASE_URL')+'/ekoapi/v3/user/account/services?'+q.toString(),{method:'GET',headers:{developer_key:env('EKO_DEVELOPER_KEY'),'secret-key':security.secretKey,'secret-key-timestamp':security.secretKeyTimestamp}});
 const raw=await response.json().catch(()=>null);if(!response.ok)throw new Error('EKO_USER_SERVICES_HTTP_'+response.status);
 return raw as unknown;
}