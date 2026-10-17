import {EkoAepsProvider} from './eko-aeps';
import {SpiceMoneyAepsProvider} from './spice-money-aeps';
import type {YcmAepsProvider} from './ycm-aeps';
export type YcmAepsProviderCode='SPICE_MONEY'|'EKO';
export type YcmAepsAuthenticationMode='fingerprint'|'face'|'iris';
export function getAepsProvider(code:YcmAepsProviderCode):YcmAepsProvider{
 switch(code){case 'SPICE_MONEY':return new SpiceMoneyAepsProvider();case 'EKO':return new EkoAepsProvider();default:throw new Error('AEPS_PROVIDER_UNSUPPORTED');}
}
export function configuredAepsProvider():YcmAepsProviderCode{const code=(process.env.YCM_AEPS_PROVIDER||'SPICE_MONEY').toUpperCase();if(code!=='SPICE_MONEY'&&code!=='EKO')throw new Error('AEPS_PROVIDER_UNSUPPORTED');return code as YcmAepsProviderCode;}