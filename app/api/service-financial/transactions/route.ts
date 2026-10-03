import {NextRequest,NextResponse} from 'next/server';
import {recordSuccessfulFinancialTransaction} from '../../../lib/ycm-financial-ledger';
export const runtime='nodejs';
function secretOk(r:NextRequest){return !!process.env.YCM_SERVICE_FINANCIAL_WEBHOOK_SECRET&&r.headers.get('x-ycm-service-financial-secret')===process.env.YCM_SERVICE_FINANCIAL_WEBHOOK_SECRET;}
export async function POST(r:NextRequest){
 if(!secretOk(r))return NextResponse.json({success:false,code:'SERVICE_FINANCIAL_WEBHOOK_UNAUTHORIZED'},{status:401});
 const b=await r.json().catch(()=>null) as {transactionId?:string;transactionType?:string;serviceCode?:string;amountPaise?:number;agentUserId?:string;referralUserId?:string;providerCode?:string;providerTransactionId?:string;providerFeePaise?:number;metadata?:Record<string,unknown>}|null;
 const amountPaise=b?.amountPaise;
 const providerFeePaise=b?.providerFeePaise;
 if(!b?.transactionId||!b.serviceCode||!b.transactionType||typeof amountPaise!=='number'||!Number.isInteger(amountPaise)||amountPaise<=0||amountPaise>100000000000)return NextResponse.json({success:false,code:'SERVICE_FINANCIAL_FIELDS_REQUIRED'},{status:400});
 if(b.providerFeePaise!==undefined&&(!Number.isInteger(b.providerFeePaise)||b.providerFeePaise<0||providerFeePaise>amountPaise))return NextResponse.json({success:false,code:'PROVIDER_FEE_INVALID'},{status:400});
 try{const result=await recordSuccessfulFinancialTransaction({externalReference:'service:'+b.transactionId,transactionType:b.transactionType,serviceCode:b.serviceCode,agentUserId:b.agentUserId,referralUserId:b.referralUserId,providerCode:b.providerCode,providerTransactionId:b.providerTransactionId,grossAmountPaise:amountPaise,providerFeePaise:typeof providerFeePaise==='number'?providerFeePaise:0,currency:'INR',metadata:b.metadata});return NextResponse.json({success:true,...result});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'SERVICE_LEDGER_POST_FAILED'},{status:400});}
}