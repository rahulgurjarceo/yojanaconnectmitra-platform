import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {getEkoUserServices} from '../../../../../lib/eko-user-services';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!['management','ceo','admin'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as {userId?:string}|null;if(!b?.userId)return NextResponse.json({success:false,code:'USER_ID_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const account=(await sql.unsafe('SELECT account_id,eko_user_code FROM ycm_eko_retailer_accounts WHERE user_id=$1 LIMIT 1',[b.userId]))[0];if(!account)return NextResponse.json({success:false,code:'EKO_RETAILER_NOT_FOUND'},{status:404});
  const services=await getEkoUserServices(account.eko_user_code);
  const json=JSON.stringify(services);
  const row=(await sql.unsafe('UPDATE ycm_eko_retailer_accounts SET metadata=metadata || $1::jsonb,updated_at=NOW() WHERE account_id=$2 RETURNING account_id,user_id,eko_user_code,status,service_code,activated_at,daily_auth_at,metadata,updated_at',[json,account.account_id]))[0];
  return NextResponse.json({success:true,retailer:row,services});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'EKO_SERVICE_STATUS_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}