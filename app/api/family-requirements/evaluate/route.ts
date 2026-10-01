import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';

type Member = {
  member_id: string;
  full_name: string | null;
  relation: string | null;
  date_of_birth: string | null;
  verified: boolean;
};

type Rule = {
  rule_id: string;
  requirement_type: string;
  document_type: string | null;
  member_condition: unknown;
  condition: unknown;
};

type Doc = {
  document_id: string;
  member_id: string | null;
  document_type: string;
  ocr_status: string;
  validation_status: string;
};

type ResultRow = {
  status: string;
};

const db = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url
    ? postgres(url, { max: 3, prepare: false, connect_timeout: 10, idle_timeout: 20 })
    : null;
};

function matchesCondition(condition: unknown, member: Member) {
  if (!condition || typeof condition !== 'object') return true;
  const value = condition as Record<string, unknown>;

  if (value.relation && String(value.relation).toLowerCase() !== String(member.relation || '').toLowerCase()) {
    return false;
  }

  if (value.gender && typeof value.gender === 'string') {
    return true;
  }

  return true;
}

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) {
    return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    familyId?: string;
    serviceCode?: string;
    stateCode?: string;
  } | null;

  if (!body?.familyId || !body.serviceCode) {
    return NextResponse.json(
      { success: false, code: 'FAMILY_ID_AND_SERVICE_CODE_REQUIRED' },
      { status: 400 }
    );
  }

  const managementRoles = ['ceo', 'admin', 'management'];
  const serviceRoles = ['employee', 'partner', 'referral'];

  if (!managementRoles.includes(session.role) && !serviceRoles.includes(session.role) && session.familyId !== body.familyId) {
    return NextResponse.json({ success: false, code: 'FAMILY_ACCESS_DENIED' }, { status: 403 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  }

  try {
    const members = (await sql`
      SELECT member_id, full_name, relation, date_of_birth, verified
      FROM ycm_family_members
      WHERE family_id = ${body.familyId}
      ORDER BY created_at
    `) as unknown as Member[];

    const rules = (await sql`
      SELECT rule_id, requirement_type, document_type, member_condition, condition, priority
      FROM ycm_requirement_rules
      WHERE country = 'IN'
        AND service_code = ${body.serviceCode}
        AND status = 'active'
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
        AND (${body.stateCode || null} IS NULL OR state_code IS NULL OR state_code = ${body.stateCode || null})
      ORDER BY priority ASC
    `) as unknown as Rule[];

    const docs = (await sql`
      SELECT document_id, member_id, document_type, ocr_status, validation_status
      FROM ycm_document_intelligence
      WHERE family_id = ${body.familyId}
      ORDER BY updated_at DESC
    `) as unknown as Doc[];

    await sql`
      DELETE FROM ycm_family_requirement_status
      WHERE family_id = ${body.familyId}
        AND service_code = ${body.serviceCode}
    `;

    const results: ResultRow[] = [];

    for (const rule of rules) {
      const targets = members.filter((member) => matchesCondition(rule.member_condition, member));

      if (rule.requirement_type === 'document' && rule.document_type) {
        for (const member of targets) {
          const verifiedDocument = docs.find(
            (doc) =>
              doc.member_id === member.member_id &&
              doc.document_type === rule.document_type &&
              doc.validation_status === 'verified'
          );

          const pendingDocument = docs.find(
            (doc) =>
              doc.member_id === member.member_id &&
              doc.document_type === rule.document_type &&
              (doc.ocr_status === 'processing' || doc.validation_status === 'manual_review')
          );

          const status = verifiedDocument ? 'verified' : pendingDocument ? 'action_required' : 'missing';
          const reason = verifiedDocument
            ? 'Document verified.'
            : pendingDocument
              ? 'Document needs human review or OCR completion.'
              : 'Required document is not available or verified.';
          const nextAction = verifiedDocument
            ? 'Continue to eligibility/application.'
            : pendingDocument
              ? 'Review or correct the document before continuing.'
              : `Upload ${rule.document_type} for ${member.full_name || 'member'}.`;

          const row = (await sql`
            INSERT INTO ycm_family_requirement_status
              (family_id, member_id, service_code, rule_id, status, reason_code, reason, next_action)
            VALUES
              (${body.familyId}, ${member.member_id}, ${body.serviceCode}, ${rule.rule_id}, ${status},
               ${status === 'verified' ? 'VERIFIED' : 'DOCUMENT_REQUIRED'}, ${reason}, ${nextAction})
            RETURNING *
          `)[0];

          results.push(row as ResultRow);
        }
      } else {
        const targetMembers = targets.length ? targets : [null];

        for (const member of targetMembers) {
          const status = rule.requirement_type === 'payment' ? 'required' : 'action_required';
          const reason =
            rule.requirement_type === 'payment'
              ? 'Payment requirement must be completed before execution.'
              : 'Requirement needs service-specific verification.';
          const nextAction =
            rule.requirement_type === 'payment'
              ? 'Complete payment after the payable amount is confirmed.'
              : 'Review this requirement with the assigned Mitra.';

          const row = (await sql`
            INSERT INTO ycm_family_requirement_status
              (family_id, member_id, service_code, rule_id, status, reason_code, reason, next_action)
            VALUES
              (${body.familyId}, ${member?.member_id || null}, ${body.serviceCode}, ${rule.rule_id}, ${status},
               ${rule.requirement_type.toUpperCase()}, ${reason}, ${nextAction})
            RETURNING *
          `)[0];

          results.push(row as ResultRow);
        }
      }
    }

    return NextResponse.json({
      success: true,
      familyId: body.familyId,
      serviceCode: body.serviceCode,
      evaluated: results.length,
      requirements: results,
      summary: {
        missing: results.filter((row) => row.status === 'missing').length,
        actionRequired: results.filter((row) => row.status === 'action_required').length,
        verified: results.filter((row) => row.status === 'verified').length,
        required: results.filter((row) => row.status === 'required').length
      }
    });
  } finally {
    await sql.end({ timeout: 3 });
  }
}
