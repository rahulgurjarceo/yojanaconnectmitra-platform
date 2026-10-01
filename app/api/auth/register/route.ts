import { NextResponse } from 'next/server';
import { createUser } from '../../../lib/ycm-auth-db';

export const runtime='nodejs';

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {fullName?:string;email?:string;mobile?:string;password?:string}|null;
 if(!body?.fullName?.trim() || !body.password) return NextResponse.json({success:false,code:'REGISTRATION_REQUIRED'},{status:400});
 try{
  const user=await createUser({fullName:body.fullName,email:body.email,mobile:body.mobile,password:body.password,role:'family'});
  return NextResponse.json({success:true,userId:user.user_id,role:'family'});
 }catch(e){
  const code=e instanceof Error?e.message:'REGISTRATION_ERROR';
  if(code.includes('duplicate')||code.includes('unique')) return NextResponse.json({success:false,code:'ACCOUNT_ALREADY_EXISTS',message:'यह email/mobile पहले से registered है.'},{status:409});
  if(code==='PASSWORD_POLICY') return NextResponse.json({success:false,code,message:'Password कम से कम 12 characters, uppercase, lowercase और number वाला होना चाहिए.'},{status:400});
  return NextResponse.json({success:false,code},{status:code==='DATABASE_NOT_CONFIGURED'?503:500});
 }
}
