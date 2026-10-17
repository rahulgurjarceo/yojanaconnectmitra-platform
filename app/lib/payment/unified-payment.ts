import crypto from 'node:crypto';

export type PaymentProviderCode='razorpay'|'payu'|'paytm';
export type PaymentEnvironment='test'|'live';

export type UnifiedPaymentOrder={orderId:string;amount:number;currency:string;provider:PaymentProviderCode;status:'created';checkoutData?:Record<string,string>};
export type UnifiedPaymentResult={verified:boolean;providerPaymentId?:string;rawStatus?:string};

export interface UnifiedPaymentProvider{
 code:PaymentProviderCode;
 createOrder(input:{membershipId:string;amount:number;currency:string;customer:{name?:string;email?:string;phone?:string}}):Promise<UnifiedPaymentOrder>;
 verifyPayment(input:{orderId:string;paymentId:string;signature:string}):Promise<UnifiedPaymentResult>;
 refund?(input:{paymentId:string;amount?:number}):Promise<{success:boolean;refundId?:string}>;
}

export function paymentEnvironment():PaymentEnvironment{
 return process.env.YCM_PAYMENT_ENV==='live'?'live':'test';
}
export function enabledPaymentProviders():PaymentProviderCode[]{
 return (process.env.YCM_PAYMENT_PROVIDERS||'razorpay,payu,paytm').split(',').map(v=>v.trim()).filter((v):v is PaymentProviderCode=>['razorpay','payu','paytm'].includes(v));
}
function required(...keys:string[]){return keys.filter(k=>!process.env[k]);}
export function paymentProviderReadiness(code:PaymentProviderCode){
 if(code==='razorpay')return {code,configured:required('RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET').length===0,missing:required('RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET')};
 if(code==='payu')return {code,configured:required('PAYU_MERCHANT_KEY','PAYU_MERCHANT_SALT').length===0,missing:required('PAYU_MERCHANT_KEY','PAYU_MERCHANT_SALT')};
 return {code,configured:required('PAYTM_MID','PAYTM_MERCHANT_KEY','PAYTM_WEBSITE','PAYTM_CLIENT_ID').length===0,missing:required('PAYTM_MID','PAYTM_MERCHANT_KEY','PAYTM_WEBSITE','PAYTM_CLIENT_ID')};
}
export function assertSafePaymentEnvironment(){
 if(paymentEnvironment()==='live'&&process.env.NODE_ENV!=='production')throw new Error('LIVE_PAYMENT_REQUIRES_PRODUCTION');
}
export function payuHash(input:string,salt:string){return crypto.createHash('sha512').update(input+salt).digest('hex');}
export function hmacSha256(input:string,secret:string){return crypto.createHmac('sha256',secret).update(input).digest('hex');}

/*
Provider adapters are deliberately isolated. Add/enable credentials through environment/secret manager:
Razorpay: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
PayU: PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT
Paytm: PAYTM_MID, PAYTM_MERCHANT_KEY, PAYTM_WEBSITE, PAYTM_CLIENT_ID
Never send secrets to the browser and never commit .env files.
*/
