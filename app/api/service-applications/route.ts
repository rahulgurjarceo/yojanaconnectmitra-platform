import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';
import { evaluateDocumentCompliance, selectDocumentValidityRule, type DocumentValidityRule } from '../../lib/ycm-document-validity';

export const runtime = 'nodejs';

const LEGACY_MISSING_OR_EXPIRED_CODE = 'MISSING_OR_EXPIRED';

const db = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 4, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};

type PrefillField = string | { field?: string; source?: string };
type DocumentRecord = {
  document_id:string; member_id:string|null; document_type:string; status?:string|null;
  storage_ref:string|null; sha256?:string|null; validation_status?:string|null;
  verified_at?:string|null; valid_from?:string|null; valid_until?:string|null;
  uploaded_at?:string|null; created_at:string;
};
type FamilyRecord = {family_id:string;full_name:string;mobile:string;email?:string|null;country:string};
type MemberRecord = {member_id:string;full_name:string;relation:string;mobile:string|null;email:string|null;date_of_birth:string|null;verified:boolean};
type SnapshotEntry = {documentCode:string;documentName:string;required:boolean;source:string;reusable:boolean;documentId:string;storageRef:string|null;validUntil:string|Date|null;action:string};
type ServiceDocumentRule = {
  document_code: string;
  document_name: string;
  required: boolean;
  required_for_application: boolean;
  validation_mode: string;
  validity_days: number | null;
  expiry_warning_days: number;
  reuse_if_valid: boolean;
  reupload_on_expiry: boolean;
  prefill_fields: PrefillField[];
};

function familyAllowed(session: ReturnType<typeof verifySession>, familyId: string) {
  if (!session) return false;
  // Only platform administrators may operate on arbitrary families. All other
  // sessions must be explicitly bound to the target family to prevent IDOR.
  if (['ceo', 'admin', 'management'].includes(session.role)) return true;
  return session.familyId === familyId;
}

function addDays(value: Date, days: number | null) {
  if (days == null) return null;
  const out = new Date(value);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function isUsableDocument(doc: DocumentRecord, rule: ServiceDocumentRule) {
  if (!rule.reuse_if_valid) return false;
  if (doc.validation_status && doc.validation_status !== 'verified') return false;
  if (doc.status && !['verified', 'active', 'approved', 'uploaded'].includes(doc.status)) return false;
  return Boolean(doc.storage_ref);
}

function getPrefillValue(field: string, family: FamilyRecord, member: MemberRecord|null) {
  const map: Record<string, unknown> = {
    family_id: family.family_id, familyId: family.family_id,
    full_name: member?.full_name || family.full_name, name: member?.full_name || family.full_name,
    mobile: member?.mobile || family.mobile, email: member?.email || family.email || null,
    date_of_birth: member?.date_of_birth || null, dob: member?.date_of_birth || null,
    relation: member?.relation || null, country: family.country
  };
  return map[field] ?? null;
}

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });

  const body = await request.json().catch(() => null) as { familyId?: string; serviceCode?: string; memberId?: string; applicationDeadline?: string; eventDate?: string } | null;
  const familyId = body?.familyId || session.familyId || '';
  const serviceCode = String(body?.serviceCode || '').trim().toUpperCase();
  if (!familyId || !serviceCode) return NextResponse.json({ success: false, code: 'FAMILY_ID_AND_SERVICE_CODE_REQUIRED' }, { status: 400 });
  if (!familyAllowed(session, familyId)) return NextResponse.json({ success: false, code: 'FAMILY_ACCESS_DENIED' }, { status: 403 });

  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    const service = (await sql`
      SELECT service_code,service_name,status,validity_days,expiry_warning_days,renewal_allowed,renewal_window_days,prefill_fields
      FROM ycm_service_master WHERE service_code=${serviceCode} LIMIT 1
    `)[0];
    if (!service) return NextResponse.json({ success: false, code: 'SERVICE_NOT_FOUND' }, { status: 404 });
    if (service.status !== 'active') return NextResponse.json({ success: false, code: 'SERVICE_NOT_ACTIVE' }, { status: 409 });

    const family = (await sql`SELECT family_id,full_name,mobile,email,country FROM ycm_families WHERE family_id=${familyId} LIMIT 1`)[0] as unknown as FamilyRecord;
    if (!family) return NextResponse.json({ success: false, code: 'FAMILY_NOT_FOUND' }, { status: 404 });

    const member = (body?.memberId
      ? (await sql`SELECT member_id,full_name,relation,mobile,email,date_of_birth,verified FROM ycm_family_members WHERE family_id=${familyId} AND member_id=${body.memberId} LIMIT 1`)[0]
      : (await sql`SELECT member_id,full_name,relation,mobile,email,date_of_birth,verified FROM ycm_family_members WHERE family_id=${familyId} ORDER BY verified DESC,created_at LIMIT 1`)[0] || null) as unknown as MemberRecord | null;
    if (body?.memberId && !member) return NextResponse.json({ success: false, code: 'MEMBER_NOT_FOUND' }, { status: 404 });

    const rules = await sql`SELECT document_code,document_name,required,required_for_application,validation_mode,validity_days,expiry_warning_days,reuse_if_valid,reupload_on_expiry,prefill_fields
      FROM ycm_service_documents WHERE service_code=${serviceCode} ORDER BY document_name` as unknown as ServiceDocumentRule[];

    const validityRules = await sql`SELECT rule_id,document_type,context_type,context_code,validity_days,validity_basis,requires_before_deadline,warning_days,metadata
      FROM ycm_document_validity_rules WHERE active=true ORDER BY context_type` as unknown as DocumentValidityRule[];

    const docs = await sql`SELECT document_id,member_id,document_type,status,storage_ref,sha256,verified_at,valid_from,valid_until,uploaded_at,created_at
      FROM ycm_family_documents WHERE family_id=${familyId}
      ORDER BY uploaded_at DESC NULLS LAST,created_at DESC`;
    const intel = await sql`SELECT document_id,member_id,document_type,storage_ref,sha256,validation_status,updated_at AS verified_at
      FROM ycm_document_intelligence WHERE family_id=${familyId} AND validation_status='verified'
      ORDER BY updated_at DESC`;

    const allDocs = ([...docs, ...intel] as DocumentRecord[]).filter(d => !member?.member_id || !d.member_id || d.member_id === member.member_id);
    const snapshot: SnapshotEntry[] = [];
    const missing: Array<{documentCode:string;documentName:string;required:boolean;action:string;reason:string;legacyReason:string;reuploadOnExpiry:boolean;validityDays:number|null;expiryWarningDays:number;compliance?:unknown}> = [];
    const findings: Array<Record<string,unknown>> = [];
    const applicationDeadline = body?.applicationDeadline ? new Date(body.applicationDeadline) : null;
    const eventDate = body?.eventDate ? new Date(body.eventDate) : null;

    if (applicationDeadline && Number.isNaN(applicationDeadline.getTime())) {
      return NextResponse.json({ success:false, code:'INVALID_APPLICATION_DEADLINE' }, { status:400 });
    }

    for (const rule of rules) {
      if (!rule.required_for_application) continue;
      const contextRule = selectDocumentValidityRule(rule.document_code, serviceCode, validityRules);
      const effectiveRule: DocumentValidityRule | null = contextRule || (rule.validity_days ? {
        document_type: rule.document_code, context_type: 'service', context_code: serviceCode,
        validity_days: rule.validity_days, validity_basis: 'fixed_days',
        requires_before_deadline: false, warning_days: rule.expiry_warning_days
      } : null);

      const candidates = allDocs.filter(d =>
        String(d.document_type).toUpperCase() === String(rule.document_code).toUpperCase() && isUsableDocument(d, rule)
      );
      let best: { doc: DocumentRecord; compliance: ReturnType<typeof evaluateDocumentCompliance> } | null = null;
      for (const candidate of candidates) {
        const compliance = evaluateDocumentCompliance({
          documentType: rule.document_code,
          validFrom: candidate.valid_from || candidate.verified_at || candidate.uploaded_at || candidate.created_at,
          validUntil: candidate.valid_until,
          rule: effectiveRule,
          applicationDeadline,
          eventDate
        });
        if (compliance.status === 'valid' || compliance.status === 'expiring_soon') {
          best = { doc: candidate, compliance };
          break;
        }
        if (!best) best = { doc: candidate, compliance };
      }

      if (best && (best.compliance.status === 'valid' || best.compliance.status === 'expiring_soon')) {
        snapshot.push({
          documentCode: rule.document_code, documentName: rule.document_name,
          required: rule.required, source: 'existing', reusable: true,
          documentId: best.doc.document_id, storageRef: best.doc.storage_ref,
          validUntil: best.compliance.validUntil, action: best.compliance.status === 'expiring_soon' ? 'renew_soon' : 'reuse'
        });
        findings.push({ documentCode:rule.document_code, documentName:rule.document_name, required:rule.required, ...best.compliance });
        continue;
      }

      const compliance = best?.compliance || evaluateDocumentCompliance({
        documentType: rule.document_code, rule: effectiveRule, applicationDeadline, eventDate
      });
      const hardFailure = ['expired','deadline_violation','manual_review','invalid_context'].includes(compliance.status);
      const reason = best ? compliance.code : 'DOCUMENT_MISSING';
      missing.push({
        documentCode: rule.document_code, documentName: rule.document_name,
        required: rule.required, action: hardFailure ? 'resolve_deficiency' : 'upload',
        reason, legacyReason: hardFailure || reason === 'DOCUMENT_MISSING' ? LEGACY_MISSING_OR_EXPIRED_CODE : reason, reuploadOnExpiry: rule.reupload_on_expiry,
        validityDays: effectiveRule?.validity_days ?? rule.validity_days,
        expiryWarningDays: effectiveRule?.warning_days ?? rule.expiry_warning_days,
        compliance
      });
      findings.push({ documentCode:rule.document_code, documentName:rule.document_name, required:rule.required, ...compliance });
    }

    const requiredCount = rules.filter(r => r.required_for_application && r.required).length;
    const hardDeficiencies = missing.filter(x => x.required);
    const validRequired = findings.filter(x => x.required === true && ['valid','expiring_soon'].includes(String(x.status))).length;
    const warnings = findings.filter(x => x.status === 'expiring_soon').length;
    const complianceScore = requiredCount === 0 ? 100 : Math.max(0, Math.round((validRequired / requiredCount) * 100) - warnings * 5);
    const riskLevel = hardDeficiencies.length ? 'red' : warnings ? 'yellow' : 'green';
    const recommendations = [...new Set(
      hardDeficiencies.map(x => x.reason === 'DOCUMENT_EXPIRED' ? `Renew ${x.documentName}` :
        x.reason === 'DOCUMENT_ISSUED_AFTER_APPLICATION_DEADLINE' ? `Replace ${x.documentName} with a document meeting the deadline rule` :
        x.reason === 'DOCUMENT_MISSING' ? `Upload ${x.documentName}` : `Review ${x.documentName}: ${x.reason}`)
    )];
    const complianceAnalysis = {
      score: complianceScore, riskLevel, requiredCount, validRequired, warningCount: warnings,
      hardDeficiencyCount: hardDeficiencies.length, applicationDeadline: applicationDeadline?.toISOString() || null,
      findings, recommendations, generatedAt: new Date().toISOString()
    };

    const ready = hardDeficiencies.length === 0;
    const prefillFields = Array.isArray(service.prefill_fields) ? service.prefill_fields : [];
    const prefilledData: Record<string, unknown> = {};
    for (const item of prefillFields as PrefillField[]) {
      const field = typeof item === 'string' ? item : String(item.field || '');
      if (!field) continue;
      const source = typeof item === 'string' ? field : String(item.source || field);
      prefilledData[field] = getPrefillValue(source, family, member);
    }
    if (!Object.keys(prefilledData).length) {
      for (const field of ['full_name', 'mobile', 'email', 'date_of_birth', 'relation', 'family_id']) {
        prefilledData[field] = getPrefillValue(field, family, member);
      }
    }

    const app = (await sql`
      INSERT INTO ycm_service_applications(family_id,member_id,service_code,status,prefilled_data,document_snapshot,missing_documents,application_deadline,compliance_analysis,expires_at)
      VALUES(${familyId},${member?.member_id || null},${serviceCode},${ready ? 'ready' : 'draft'},${JSON.stringify(prefilledData)}::jsonb,${JSON.stringify(snapshot)}::jsonb,${JSON.stringify(missing)}::jsonb,${applicationDeadline},${JSON.stringify(complianceAnalysis)}::jsonb,
        CASE WHEN ${service.validity_days || null} IS NULL THEN NULL ELSE NOW() + (${Number(service.validity_days)} || ' days')::interval END)
      RETURNING application_id,status,created_at,expires_at
    `)[0];

    return NextResponse.json({
      success: true, application: app, service: {
        serviceCode: service.service_code, serviceName: service.service_name,
        validityDays: service.validity_days, expiryWarningDays: service.expiry_warning_days,
        renewalAllowed: service.renewal_allowed, renewalWindowDays: service.renewal_window_days
      },
      member, prefilledData, documents: snapshot, missingDocuments: missing, compliance: complianceAnalysis,
      nextStep: ready ? 'review_and_submit' : 'upload_missing_documents'
    }, { status: 201, headers: { 'Cache-Control': 'private,no-store' } });
  } catch (error) {
    console.error('Service application preparation failed', error);
    return NextResponse.json({ success: false, code: 'SERVICE_APPLICATION_PREPARE_FAILED' }, { status: 500 });
  } finally {
    await sql.end({ timeout: 3 });
  }
}
