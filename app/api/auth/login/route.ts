import { NextResponse } from 'next/server';
import { findUser } from '../../../lib/ycm-auth-db';
import { verifyPassword } from '../../../lib/ycm-password';
import { issueVerifiedSession } from '../../../lib/ycm-auth-issuance';
import { YCM_ROLES, type YcmRole } from '../../../lib/ycm-access-control';

export const runtime='nodejs';

export async function POST(request:Request){
  const body=await request.json().catch(()=>null) as {identifier?:string;password?:string}|null;
  const identifier=body?.identifier?.trim()||'', password=body?.password||'';
  if(!identifier||!password) return NextResponse.json({success:false,code:'INVALID_CREDENTIALS',message:'User ID / mobile / email और password दर्ज करें.'},{status:400});
  try{
    const user=await findUser(identifier);
    const valid=user ? await verifyPassword(password,user.password_hash) : false;
    if(!valid || user.status!=='active' || !YCM_ROLES.includes(user.role as YcmRole))
      return NextResponse.json({success:false,code:'INVALID_CREDENTIALS',message:'User ID, mobile या email और password सही नहीं है.'},{status:401});
    return issueVerifiedSession({subject:user.user_id,role:user.role as YcmRole,authVersion:Number(user.auth_version ?? 1),...(user.role==='family'?{familyId:user.user_id}:{}),...(user.role==='employee'?{employeeId:user.user_id}:{})});
  }catch(e){
    const code=e instanceof Error?e.message:'AUTH_ERROR';
    return NextResponse.json({success:false,code},{status:code==='DATABASE_NOT_CONFIGURED'?503:500});
  }
}
