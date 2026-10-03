import { NextRequest, NextResponse } from 'next/server';
import { linkVerifiedLoginIdentifier, YCM_LOGIN_IDENTIFIER_TYPES, type YcmLoginIdentifierType } from '../../../lib/ycm-auth-db';
import { verifySession, sessionCookieName } from '../../../lib/ycm-access-control';
export const runtime='nodejs';
export async function POST(request:NextRequest) {
  const session=verifySession(request.cookies.get(sessionCookieName())?.value);
  if(!session || !['ceo','admin','management'].includes(session.role)) return NextResponse.json({success:false,code:'AUTHORIZATION_REQUIRED'},{status:403});
  const body=await request.json().catch(()=>null) as {userId?:string;identifierType?:YcmLoginIdentifierType;identifier?:string;verificationSource?:string}|null;
  if(!body?.userId || !body.identifierType || !body.identifier || !body.verificationSource) return NextResponse.json({success:false,code:'IDENTITY_LINK_FIELDS_REQUIRED',supportedTypes:YCM_LOGIN_IDENTIFIER_TYPES},{status:400});
  try {
    const result=await linkVerifiedLoginIdentifier({userId:body.userId,identifierType:body.identifierType,identifier:body.identifier,verificationSource:body.verificationSource});
    return NextResponse.json({success:true,identifier:result});
  } catch(e) {
    const code=e instanceof Error?e.message:'IDENTITY_LINK_FAILED';
    return NextResponse.json({success:false,code},{status:400});
  }
}