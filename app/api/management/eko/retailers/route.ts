import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const privileged=(role:string)=>['management','ceo','admin'].includes(role);
const validDate=(v?:string)=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d;};
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!privileged(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as {userId?:string;ekoUserCode?:string;status?:'pending'|'active'|'suspended';dailyAuthAt?:string}|null;
 if(!b?.userId||!b.ekoUserCode)return NextResponse.json({success:false,code:'EKO_RETAILER_FIELDS_REQUIRED'},{status:400});
 const dailyAuthAt=validDate(b.dailyAuthAt);if(b.dailyAuthAt&&!dailyAuthAt)return NextResponse.json({success:false,code:'EKO_DAILY_AUTH_DATE_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const row=(await sql`INSERT INTO ycm_eko_retailer_accounts(user_id,eko_user_code,status,daily_auth_at)
   VALUES(${b.userId},${b.ekoUserCode},${b.status??'pending'},${dailyAuthAt})
   ON CONFLICT(user_id) DO UPDATE SET eko_user_code=EXCLUDED.eko_user_code,status=EXCLUDED.status,daily_auth_at=EXCLUDED.daily_auth_at,updated_at=NOW()
   RETURNING account_id,user_id,eko_user_code,status,service_code,activated_at,daily_auth_at,created_at,updated_at`)[0];
  return NextResponse.json({success:true,retailer:row},{status:201});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'EKO_RETAILER_BIND_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!privileged(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:s?403:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const rows=await sql`SELECT account_id,user_id,eko_user_code,status,service_code,activated_at,daily_auth_at,created_at,updated_at FROM ycm_eko_retailer_accounts ORDER BY updated_at DESC`;return NextResponse.json({success:true,retailers:rows});}finally{await sql.end({timeout:3});}
}
export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!privileged(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as {userId?:string;status?:'pending'|'active'|'suspended';activatedAt?:string;dailyAuthAt?:string}|null;
 if(!b?.userId)return NextResponse.json({success:false,code:'USER_ID_REQUIRED'},{status:400});
 const activatedAt=validDate(b.activatedAt),dailyAuthAt=validDate(b.dailyAuthAt);
 if((b.activatedAt&&!activatedAt)||(b.dailyAuthAt&&!dailyAuthAt))return NextResponse.json({success:false,code:'EKO_DATE_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const rows=await sql`UPDATE ycm_eko_retailer_accounts SET
   status=COALESCE(${b.status??null},status),activated_at=COALESCE(${activatedAt},activated_at),daily_auth_at=COALESCE(${dailyAuthAt},daily_auth_at),updated_at=NOW()
   WHERE user_id=${b.userId}
   RETURNING account_id,user_id,eko_user_code,status,service_code,activated_at,daily_auth_at,updated_at`;
  if(!rows[0])return NextResponse.json({success:false,code:'EKO_RETAILER_NOT_FOUND'},{status:404});
  return NextResponse.json({success:true,retailer:rows[0]});
 }finally{await sql.end({timeout:3});}
}
