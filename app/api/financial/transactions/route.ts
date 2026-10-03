import postgres from 'postgres';
import {timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
import {recordSuccessfulFinancialTransaction,reverseFinancialTransaction} from '../../../lib/ycm-financial-ledger';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const privileged=['ceo','management','admin'];
function actor(r:NextRequest){return verifySession(r.cookies.get(sessionCookieName())?.value);}
export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const u=new URL(r.url),limit=Math.min(Math.max(Number(u.searchParams.get('limit')||50),1),100);
 const actorRows=privileged.includes(s.role)?[]:await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`; const actorId=actorRows[0]?.id??null;
 const rows=privileged.includes(s.role)?await sql`SELECT t.*,COALESCE(jsonb_agg(jsonb_build_object('recipientType',sp.recipient_type,'recipientUserId',sp.recipient_user_id,'percent',sp.percent,'amountPaise',sp.amount_paise,'status',sp.status)) FILTER(WHERE sp.split_id IS NOT NULL),'[]'::jsonb) splits FROM ycm_financial_transactions t LEFT JOIN ycm_transaction_splits sp ON sp.transaction_id=t.transaction_id GROUP BY t.transaction_id ORDER BY t.created_at DESC LIMIT ${limit}`:await sql`SELECT t.*,COALESCE(jsonb_agg(jsonb_build_object('recipientType',sp.recipient_type,'recipientUserId',sp.recipient_user_id,'percent',sp.percent,'amountPaise',sp.amount_paise,'status',sp.status)) FILTER(WHERE sp.split_id IS NOT NULL),'[]'::jsonb) splits FROM ycm_financial_transactions t LEFT JOIN ycm_transaction_splits sp ON sp.transaction_id=t.transaction_id WHERE t.agent_user_id=${actorId} OR t.referral_user_id=${actorId} GROUP BY t.transaction_id ORDER BY t.created_at DESC LIMIT ${limit}`;
 return NextResponse.json({success:true,transactions:rows});}finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as {externalReference?:string;transactionType?:string;grossAmountPaise?:number;serviceCode?:string;customerUserId?:string;agentUserId?:string;referralUserId?:string;providerCode?:string;providerTransactionId?:string;providerFeePaise?:number;currency?:string;metadata?:Record<string,unknown>}|null;
 if(!b?.externalReference||!b?.transactionType||!Number.isInteger(b.grossAmountPaise)||b.grossAmountPaise<=0||b.grossAmountPaise>100000000000)return NextResponse.json({success:false,code:'TRANSACTION_FIELDS_REQUIRED'},{status:400});
 if(b.providerFeePaise!==undefined&&(!Number.isInteger(b.providerFeePaise)||b.providerFeePaise<0||b.providerFeePaise>b.grossAmountPaise))return NextResponse.json({success:false,code:'PROVIDER_FEE_INVALID'},{status:400});
 const webhookSecret=process.env.YCM_FINANCIAL_WEBHOOK_SECRET||'';
 const providedWebhookSecret=r.headers.get('x-ycm-financial-secret')||'';
 const webhookOk=!!webhookSecret&&providedWebhookSecret.length===webhookSecret.length&&timingSafeEqual(Buffer.from(providedWebhookSecret),Buffer.from(webhookSecret));
 if(!privileged.includes(s.role)&&!webhookOk)return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 try{const result=await recordSuccessfulFinancialTransaction({externalReference:b.externalReference,transactionType:b.transactionType,serviceCode:b.serviceCode,customerUserId:b.customerUserId,agentUserId:b.agentUserId,referralUserId:b.referralUserId,providerCode:b.providerCode,providerTransactionId:b.providerTransactionId,grossAmountPaise:b.grossAmountPaise,providerFeePaise:Number.isInteger(b.providerFeePaise)?b.providerFeePaise:0,currency:b.currency||'INR',metadata:b.metadata});return NextResponse.json({success:true,...result},{status:201});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'FINANCIAL_TRANSACTION_FAILED'},{status:400});}
}
export async function PATCH(r:NextRequest){
 const s=actor(r);if(!s||!privileged.includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const b=await r.json().catch(()=>null) as {externalReference?:string}|null;if(!b?.externalReference)return NextResponse.json({success:false,code:'EXTERNAL_REFERENCE_REQUIRED'},{status:400});
 try{return NextResponse.json({success:true,...await reverseFinancialTransaction(b.externalReference)});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'FINANCIAL_REVERSAL_FAILED'},{status:400});}
}