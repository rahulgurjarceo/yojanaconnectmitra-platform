import {NextRequest,NextResponse} from 'next/server';
import {getMembershipPaymentProvider,createMembershipPaymentRecord} from '../../../../lib/ycm-membership-payment';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
import postgres from 'postgres';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const provider=getMembershipPaymentProvider();if(!provider)return NextResponse.json({success:false,code:'PAYMENT_PROVIDER_NOT_CONFIGURED'},{status:503});
 const b=await r.json().catch(()=>null) as {membershipId?:string}|null;if(!b?.membershipId)return NextResponse.json({success:false,code:'MEMBERSHIP_ID_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const m=(await sql`SELECT m.membership_id,m.user_id,m.membership_type,m.membership_segment,m.validity_years,m.status,m.review_status FROM ycm_memberships m JOIN ycm_users u ON u.id=m.user_id WHERE m.membership_id=${b.membershipId} AND u.user_id=${s.sub} LIMIT 1`)[0];
  if(!m)return NextResponse.json({success:false,code:'MEMBERSHIP_NOT_FOUND'},{status:404});
  if(m.status!=='pending_payment')return NextResponse.json({success:false,code:'MEMBERSHIP_NOT_PENDING_PAYMENT'},{status:409});
  if(m.membership_segment!=='standard'&&m.review_status!=='approved')return NextResponse.json({success:false,code:'SPECIAL_MEMBERSHIP_NOT_APPROVED'},{status:409});
  const order=await provider.createOrder({membershipId:m.membership_id,amount:99,currency:'INR'});
  const payment=await createMembershipPaymentRecord({membershipId:m.membership_id,provider:'configured',providerOrderId:order.orderId});
  return NextResponse.json({success:true,order,payment,membershipId:m.membership_id,validityYears:Number(m.validity_years)},{status:201});
 }catch(e){console.error('Membership payment order failed',e);return NextResponse.json({success:false,code:'PAYMENT_ORDER_FAILED'},{status:502});}finally{await sql.end({timeout:3});}
}