import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findUser, getUserPrimaryMembership, YCM_LOGIN_IDENTIFIER_TYPES, type YcmLoginIdentifierType } from '../../../lib/ycm-auth-db';
import { verifyPassword } from '../../../lib/ycm-password';
import { issueVerifiedSession } from '../../../lib/ycm-auth-issuance';
import { YCM_ROLES, type YcmRole } from '../../../lib/ycm-access-control';
import { loginRateLimited } from '../../../lib/ycm-login-rate-limit';
import { buildAuditRecord } from '../../../lib/ycm-audit-events';
import { getPostgresYcmAuditStore } from '../../../lib/ycm-postgres-audit-store';

export const runtime='nodejs';

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

async function auditLogin(input: {
  subject: string;
  role: string;
  success: boolean;
}) {
  try {
    const store = getPostgresYcmAuditStore();
    if (!store) return;
    await store.append(buildAuditRecord({
      event: input.success ? 'AUTH_LOGIN_SUCCESS' : 'AUTH_LOGIN_FAILED',
      subject: input.subject,
      role: input.role,
      success: input.success,
    }));
  } catch {
    // Login telemetry must never leak credentials or block a valid authentication.
  }
}

export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>null) as {identifier?:string;password?:string;identifierType?:YcmLoginIdentifierType}|null;
  const identifier=body?.identifier?.trim()||'', password=body?.password||'';
  if(!identifier||!password) return NextResponse.json({success:false,code:'INVALID_CREDENTIALS',message:'User ID / mobile / email और password दर्ज करें.'},{status:400});

  try{
    if (await loginRateLimited(identifier, clientKey(request))) {
      return NextResponse.json(
        {success:false,code:'LOGIN_RATE_LIMITED',message:'बहुत अधिक login attempts हैं. कृपया थोड़ी देर बाद फिर प्रयास करें.'},
        {status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}}
      );
    }

    const user=await findUser(identifier, body?.identifierType);
    if (!user) {
      await auditLogin({subject:'anonymous',role:'unknown',success:false});
      return NextResponse.json({success:false,code:'INVALID_CREDENTIALS',message:'User ID, mobile, email या verified identity identifier सही नहीं है.'},{status:401});
    }
    const valid=await verifyPassword(password,user.password_hash);
    if(!valid || user.status!=='active' || !YCM_ROLES.includes(user.role as YcmRole)){
      await auditLogin({
        subject:user?.user_id || 'anonymous',
        role:user?.role || 'unknown',
        success:false,
      });
      return NextResponse.json({success:false,code:'INVALID_CREDENTIALS',message:'User ID, mobile या email और password सही नहीं है.'},{status:401});
    }

    const membership=await getUserPrimaryMembership(user.user_id);
    const familyId = membership?.membership_type === 'family' && membership.status === 'active'
      ? membership.family_id || undefined
      : undefined;

    await auditLogin({
      subject:user.user_id,
      role:user.role,
      success:true,
    });

    return issueVerifiedSession({
      subject:user.user_id,
      role:user.role as YcmRole,
      authVersion:Number(user.auth_version ?? 1),
      ...(familyId ? {familyId} : {}),
      ...(user.role==='employee'?{employeeId:user.user_id}:{})
    });
  }catch(e){
    const code=e instanceof Error?e.message:'AUTH_ERROR';
    return NextResponse.json({success:false,code},{status:code==='DATABASE_NOT_CONFIGURED'?503:500});
  }
}
