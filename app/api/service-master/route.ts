import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value); if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const u=new URL(r.url),type=u.searchParams.get('type'),domain=u.searchParams.get('domain');
  const rows=await sql`SELECT service_id,service_code,service_name,service_type,business_domain_code,parent_service_code,channel,requires_case,requires_documents,requires_provider,status,metadata FROM ycm_service_master WHERE status='active' AND (${type} IS NULL OR service_type=${type}) AND (${domain} IS NULL OR business_domain_code=${domain}) ORDER BY service_name`;
  return NextResponse.json({success:true,services:rows},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3});}
}
