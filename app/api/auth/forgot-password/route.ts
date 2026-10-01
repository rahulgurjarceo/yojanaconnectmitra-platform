import { NextResponse } from 'next/server';
import { createResetToken, findUser, isPasswordResetRateLimited } from '../../../lib/ycm-auth-db';
import { sendPasswordResetEmail } from '../../../lib/ycm-email';

export const runtime='nodejs';

const GENERIC_MESSAGE='अगर account मौजूद है, तो password reset instructions भेज दी जाएंगी.';

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {identifier?:string}|null; const identifier=body?.identifier?.trim()||'';
 if(!identifier) return NextResponse.json({success:false,code:'IDENTIFIER_REQUIRED'},{status:400});
 try{
  if(await isPasswordResetRateLimited(identifier)) return NextResponse.json({success:true,message:GENERIC_MESSAGE});
  const user=await findUser(identifier);
  if(user && user.status==='active' && user.email){
    const token=await createResetToken(user.id as string);
    const base=(process.env.APP_URL||'http://localhost:3000').replace(//$/,'');
    const resetUrl=`${base}/reset-password?token=${encodeURIComponent(token)}`;
    const delivery=await sendPasswordResetEmail(user.email, user.full_name as string, resetUrl);
    if(process.env.NODE_ENV!=='production') console.info('[YCM DEV PASSWORD RESET]',resetUrl);
    if(process.env.NODE_ENV!=='production' && delivery.dev) return NextResponse.json({success:true,message:'Dev mode: reset link generated.',devResetUrl:resetUrl});
  }
  return NextResponse.json({success:true,message:GENERIC_MESSAGE});
 }catch(e){
  const code=e instanceof Error?e.message:'FORGOT_PASSWORD_ERROR';
  return NextResponse.json({success:false,code},{status:code==='DATABASE_NOT_CONFIGURED'?503:500});
 }
}
