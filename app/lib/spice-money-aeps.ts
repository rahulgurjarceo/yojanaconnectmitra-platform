import type {YcmAepsProvider,YcmAepsRequest,YcmAepsResult} from './ycm-aeps';
/** Provider boundary. Do not guess undocumented Spice Money API endpoints. */
export class SpiceMoneyAepsProvider implements YcmAepsProvider {
 async initiate(request:YcmAepsRequest):Promise<YcmAepsResult>{
  if(!process.env.SPICE_MONEY_API_BASE_URL||!process.env.SPICE_MONEY_API_KEY) throw new Error('SPICE_MONEY_API_NOT_CONFIGURED');
  void request; throw new Error('SPICE_MONEY_API_CONTRACT_REQUIRED');
 }
 async status(transactionId:string):Promise<YcmAepsResult>{
  if(!process.env.SPICE_MONEY_API_BASE_URL||!process.env.SPICE_MONEY_API_KEY) throw new Error('SPICE_MONEY_API_NOT_CONFIGURED');
  void transactionId; throw new Error('SPICE_MONEY_API_CONTRACT_REQUIRED');
 }
}