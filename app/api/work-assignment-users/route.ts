import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
export const runtime='nodejs';
export async function GET(r:NextRequest){
  const s=verifySession(r.cookies.get(sessionCookieName())?.value);
  if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
  if(!['ceo','admin','management'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
  const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;
  if(!u)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  const sql=postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20});
  try{const rows=await sql`SELECT user_id,full_name,role,status FROM ycm_users WHERE status='active' AND role IN ('employee','admin','management','ceo') ORDER BY full_name NULLS LAST LIMIT 500`;return NextResponse.json({success:true,users:rows},{headers:{'Cache-Control':'private,no-store'}});}finally{await sql.end({timeout:3});}
}
