import {NextRequest,NextResponse} from 'next/server';
import {recordSuccessfulFinancialTransaction,reverseFinancialTransaction} from '../../../lib/ycm-financial-ledger';
import {canCreditCommission,shouldReverseCommission,YcmAepsTransactionState} from '../../../lib/ycm-aeps';
export const runtime='nodejs';
const secretOk=(r:NextRequest)=>!!process.env.YCM_AEPS_WEBHOOK_SECRET&&r.headers.get('x-ycm-aeps-secret')===process.env.YCM_AEPS_WEBHOOK_SECRET;
export async function POST(r:NextRequest){
 if(!secretOk(r))return NextResponse.json({success:false,code:'AEPS_WEBHOOK_UNAUTHORIZED'},{status:401});
 const b=await r.json().catch(()=>null) as {transactionId?:string;state?:YcmAepsTransactionState;amountPaise?:number;partnerUserId?:string;referralUserId?:string;providerCode?:string;providerReference?:string;serviceCode?:string}|null;
 if(!b?.transactionId||!b.state||!Number.isInteger(b.amountPaise)||b.amountPaise<=0||b.amountPaise>1000000000||!b.partnerUserId)return NextResponse.json({success:false,code:'AEPS_TRANSACTION_FIELDS_REQUIRED'},{status:400});
 if(shouldReverseCommission(b.state)){try{return NextResponse.json({success:true,...await reverseFinancialTransaction('aeps:'+b.transactionId)});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'AEPS_REVERSAL_FAILED'},{status:400});}}
 if(!canCreditCommission(b.state))return NextResponse.json({success:true,status:'provider_processing',commissioned:false});
 try{const result=await recordSuccessfulFinancialTransaction({externalReference:'aeps:'+b.transactionId,transactionType:'aeps',serviceCode:b.serviceCode||'FIN_AEPS',agentUserId:b.partnerUserId,referralUserId:b.referralUserId,providerCode:b.providerCode,providerTransactionId:b.providerReference,grossAmountPaise:b.amountPaise,});return NextResponse.json({success:true,commissioned:true,...result});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'AEPS_LEDGER_POST_FAILED'},{status:400});}
}