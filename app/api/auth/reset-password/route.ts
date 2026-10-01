import { NextResponse } from 'next/server';
import { resetPassword } from '../../../lib/ycm-auth-db';

export const runtime='nodejs';

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {token?:string;password?:string}|null;
 if(!body?.token||!body.password) return NextResponse.json({success:false,code:'RESET_REQUIRED'},{status:400});
 try{await resetPassword(body.token,body.password);return NextResponse.json({success:true,message:'Password reset हो गया. अब नए password से login करें.'});}
 catch(e){const code=e instanceof Error?e.message:'RESET_ERROR';return NextResponse.json({success:false,code,message:code==='PASSWORD_POLICY'?'Password कम से कम 12 characters, uppercase, lowercase और number वाला होना चाहिए.':'Reset link invalid या expire हो गया.'},{status:400});}
}
