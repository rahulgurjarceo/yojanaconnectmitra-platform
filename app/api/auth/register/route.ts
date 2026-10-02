import { NextResponse } from 'next/server';
import { createMembership, createUser } from '../../../lib/ycm-auth-db';

export const runtime='nodejs';

type RegistrationType = 'individual' | 'family';

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {
   fullName?:string;
   email?:string;
   mobile?:string;
   password?:string;
   accountType?:RegistrationType;
 }|null;

 if(!body?.fullName?.trim() || !body.email?.trim() || !body.password)
   return NextResponse.json({success:false,code:'REGISTRATION_REQUIRED',message:'Name, email और password required हैं.'},{status:400});

 const accountType:RegistrationType = body.accountType === 'individual' ? 'individual' : 'family';

 try{
  const user=await createUser({
    fullName:body.fullName,
    email:body.email,
    mobile:body.mobile,
    password:body.password,
    role:'family'
  });

  const membership=await createMembership({userId:user.id, membershipType:accountType});

  return NextResponse.json({
    success:true,
    userId:user.user_id,
    role:'family',
    accountType,
    membership:{
      membershipId:membership.membership_id,
      planCode:membership.plan_code,
      amount:99,
      currency:'INR',
      validityYears:2,
      status:membership.status
    },
    next: accountType === 'family'
      ? 'Complete ₹99 payment, then create/activate the Family 360 profile.'
      : 'Complete ₹99 payment, then activate the Individual YCM profile.'
  });
 }catch(e){
  const code=e instanceof Error?e.message:'REGISTRATION_ERROR';
  if(code.includes('duplicate')||code.includes('unique'))
    return NextResponse.json({success:false,code:'ACCOUNT_ALREADY_EXISTS',message:'यह email/mobile पहले से registered है.'},{status:409});
  if(code==='PASSWORD_POLICY')
    return NextResponse.json({success:false,code,message:'Password कम से कम 12 characters, uppercase, lowercase और number वाला होना चाहिए.'},{status:400});
  return NextResponse.json({success:false,code},{status:code==='DATABASE_NOT_CONFIGURED'?503:500});
 }
}
