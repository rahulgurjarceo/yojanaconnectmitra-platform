import { NextResponse } from 'next/server';
import { createMembership, createUser } from '../../../lib/ycm-auth-db';

export const runtime='nodejs';

type RegistrationType = 'individual' | 'family';
type MembershipSegment = 'standard' | 'defense_family' | 'widow_household';

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {
   fullName?:string;
   email?:string;
   mobile?:string;
   password?:string;
   accountType?:RegistrationType;
   membershipSegment?:MembershipSegment;
 }|null;

 if(!body?.fullName?.trim() || !body.email?.trim() || !body.password)
   return NextResponse.json({success:false,code:'REGISTRATION_REQUIRED',message:'Name, email और password required हैं.'},{status:400});

 const accountType:RegistrationType = body.accountType === 'individual' ? 'individual' : 'family';
 const membershipSegment:MembershipSegment = body.membershipSegment === 'defense_family' || body.membershipSegment === 'widow_household' ? body.membershipSegment : 'standard';

 try{
  const user=await createUser({
    fullName:body.fullName,
    email:body.email,
    mobile:body.mobile,
    password:body.password,
    role:'family'
  });

  const membership=await createMembership({userId:user.id, membershipType:accountType, membershipSegment});

  return NextResponse.json({
    success:true,
    userId:user.user_id,
    role:'family',
    accountType,
    membership:{
      membershipId:membership.membership_id,
      planCode:membership.plan_code,
      segment:membership.membership_segment,
      amount:99,
      currency:'INR',
      validityYears:Number(membership.validity_years),
      status:membership.status
    },
    next: accountType === 'family'
      ? (membershipSegment === 'standard'
        ? 'Complete ₹99 payment, then create/activate the Household / Family 360 profile for 1 year.'
        : 'Complete ₹99 payment and required category verification, then activate the 2-year special Family membership.')
      : 'Complete ₹99 payment, then activate the Individual YCM profile for 1 year.'
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
