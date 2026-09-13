import { NextResponse } from 'next/server';
import { getCustomerFamilyOtpProvider } from '../../../../lib/customer-family-otp';
import { getPostgresCustomerFamilyRepository } from '../../../../lib/customer-family-postgres';
import { issueVerifiedSession } from '../../../../lib/ycm-auth-issuance';
import { buildAuditRecord } from '../../../../lib/ycm-audit-events';
import { getPostgresYcmAuditStore } from '../../../../lib/ycm-postgres-audit-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const provider = getCustomerFamilyOtpProvider();
  const repository = getPostgresCustomerFamilyRepository();
  if (!provider) return NextResponse.json({ success: false, code: 'OTP_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  if (!repository) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  const body = await request.json().catch(() => null) as { challengeId?: string; otp?: string } | null;
  if (!body?.challengeId || !body.otp || !/^\d{4,8}$/.test(body.otp)) {
    return NextResponse.json({ success: false, code: 'OTP_VERIFICATION_FIELDS_REQUIRED' }, { status: 400 });
  }

  try {
    const challenge = await repository.getOtpChallenge(body.challengeId);
    if (!challenge) return NextResponse.json({ success: false, code: 'OTP_CHALLENGE_NOT_FOUND' }, { status: 404 });
    if (challenge.status === 'verified') return NextResponse.json({ success: false, code: 'OTP_CHALLENGE_ALREADY_USED' }, { status: 409 });
    if (new Date(challenge.expiresAt).getTime() <= Date.now()) return NextResponse.json({ success: false, code: 'OTP_CHALLENGE_EXPIRED' }, { status: 409 });

    const result = await provider.verifyOtp(body.challengeId, body.otp);
    if (!result.verified) return NextResponse.json({ success: false, code: 'OTP_INVALID' }, { status: 400 });

    const persisted = await repository.markOtpChallengeVerified(body.challengeId);
    if (!persisted) return NextResponse.json({ success: false, code: 'OTP_CHALLENGE_NOT_ACTIVE' }, { status: 409 });
    if (!challenge.familyId) return NextResponse.json({ success: false, code: 'OTP_FAMILY_NOT_LINKED' }, { status: 409 });

    const family = await repository.findById(challenge.familyId);
    if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });
    if (family.mobile !== challenge.mobile) return NextResponse.json({ success: false, code: 'OTP_MOBILE_MISMATCH' }, { status: 403 });
    if (family.status === 'expired' || family.status === 'suspended') {
      return NextResponse.json({ success: false, code: 'FAMILY_ACCESS_BLOCKED', status: family.status }, { status: 403 });
    }

    const auditStore = getPostgresYcmAuditStore();
    if (!auditStore && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, code: 'AUTH_AUDIT_STORE_UNAVAILABLE' }, { status: 503 });
    }
    if (auditStore) {
      await auditStore.append(buildAuditRecord({
        event: 'AUTH_OTP_VERIFIED',
        subject: family.familyId,
        role: 'family',
        familyId: family.familyId,
        resourceType: 'family',
        resourceId: family.familyId,
        success: true,
      }));
    }

    return issueVerifiedSession({ subject: family.familyId, role: 'family', familyId: family.familyId });
  } catch (error) {
    console.error('customer-family OTP verification failed', error);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, code: 'OTP_AUTHENTICATION_FAILED' }, { status: 503 });
    }
    return NextResponse.json({ success: false, code: 'OTP_AUTHENTICATION_FAILED' }, { status: 500 });
  }
}
