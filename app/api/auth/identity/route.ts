import { NextRequest, NextResponse } from 'next/server';
import {
  linkVerifiedLoginIdentifier,
  YCM_LOGIN_IDENTIFIER_TYPES,
  type YcmLoginIdentifierType,
} from '../../../lib/ycm-auth-db';
import { verifySession, sessionCookieName } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';

// This endpoint records a completed, offline identity review; it is not an identity
// verification provider. Keep the accepted source labels controlled and the action
// limited to the two highest-privilege operational roles.
const ALLOWED_VERIFICATION_SOURCES = new Set([
  'manual_document_review',
  'uidai_authorized_verification',
  'jan_aadhaar_authorized_verification',
  'digilocker_authorized_verification',
  'government_partner_verification',
]);

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session || !['ceo', 'admin'].includes(session.role)) {
    return NextResponse.json({ success: false, code: 'AUTHORIZATION_REQUIRED' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    userId?: string;
    identifierType?: YcmLoginIdentifierType;
    identifier?: string;
    verificationSource?: string;
    manualVerificationConfirmed?: boolean;
  } | null;

  if (!body?.userId || !body.identifierType || !body.identifier || !body.verificationSource) {
    return NextResponse.json({
      success: false,
      code: 'IDENTITY_LINK_FIELDS_REQUIRED',
      supportedTypes: YCM_LOGIN_IDENTIFIER_TYPES,
    }, { status: 400 });
  }

  if (!YCM_LOGIN_IDENTIFIER_TYPES.includes(body.identifierType)) {
    return NextResponse.json({ success: false, code: 'IDENTIFIER_TYPE_INVALID' }, { status: 400 });
  }

  if (!ALLOWED_VERIFICATION_SOURCES.has(body.verificationSource)) {
    return NextResponse.json({ success: false, code: 'VERIFICATION_SOURCE_NOT_ALLOWED' }, { status: 400 });
  }

  if (body.manualVerificationConfirmed !== true) {
    return NextResponse.json({ success: false, code: 'IDENTITY_VERIFICATION_CONFIRMATION_REQUIRED' }, { status: 400 });
  }

  try {
    const result = await linkVerifiedLoginIdentifier({
      userId: body.userId,
      identifierType: body.identifierType,
      identifier: body.identifier,
      verificationSource: body.verificationSource,
    });
    return NextResponse.json({ success: true, identifier: result }, { headers: { 'Cache-Control': 'private,no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'IDENTITY_LINK_FAILED';
    return NextResponse.json({ success: false, code }, { status: 400 });
  }
}
