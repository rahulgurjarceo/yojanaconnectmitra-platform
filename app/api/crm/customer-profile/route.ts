import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../../lib/ycm-access-control';

export const runtime = 'nodejs';

const db = () => {
  const u = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return u ? postgres(u, { max: 5, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};

const staff = new Set(['employee', 'team_lead', 'branch_manager', 'management', 'ceo', 'admin']);
const managers = new Set(['team_lead', 'branch_manager', 'management', 'ceo', 'admin']);
const opportunityTypes = new Set(['job', 'scheme', 'scholarship', 'form', 'service', 'other']);
const opportunityStatuses = new Set(['active', 'upcoming', 'applied', 'closed', 'saved']);
const noteTypes = new Set(['general', 'job_prep', 'scheme', 'form', 'document', 'calling']);
const noteVisibility = new Set(['employee', 'customer', 'manager']);
const shareTypes = new Set(['form', 'opportunity', 'note', 'compliance']);
const shareTargets = new Set(['customer', 'employee', 'manager']);
const MAX_TITLE = 200;
const MAX_TEXT = 5000;
const MAX_JSON_BYTES = 20000;

function text(value: unknown, max = MAX_TEXT) {
  const v = String(value ?? '').trim();
  return v.length > max ? null : v;
}

function jsonObject(value: unknown) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  try {
    if (JSON.stringify(value).length > MAX_JSON_BYTES) return null;
  } catch {
    return null;
  }
  return value;
}

function safeHttpUrl(value: unknown) {
  if (value == null || value === '') return null;
  try {
    const u = new URL(String(value));
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

async function allowedFamily(sql: ReturnType<typeof postgres>, role: string, userId: string, familyId: string) {
  if (managers.has(role)) return true;
  const row = (
    await sql`SELECT 1
      FROM ycm_leads l
      JOIN ycm_users u ON u.id = l.assigned_to
      WHERE u.user_id = ${userId} AND l.family_id = ${familyId}
      LIMIT 1`
  )[0];
  return !!row;
}

export async function GET(r: NextRequest) {
  const s = verifySession(r.cookies.get(sessionCookieName())?.value);
  if (!s || !staff.has(s.role)) return NextResponse.json({ success: false, code: 'FORBIDDEN' }, { status: 403 });

  const familyId = new URL(r.url).searchParams.get('familyId')?.trim();
  if (!familyId) return NextResponse.json({ success: false, code: 'FAMILY_ID_REQUIRED' }, { status: 400 });

  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    if (!(await allowedFamily(sql, s.role, s.sub, familyId)) && s.role !== 'employee') {
      return NextResponse.json({ success: false, code: 'FAMILY_SCOPE_DENIED' }, { status: 403 });
    }
    if (!(await allowedFamily(sql, s.role, s.sub, familyId))) {
      return NextResponse.json({ success: false, code: 'FAMILY_SCOPE_DENIED' }, { status: 403 });
    }

    const [opportunities, notes, shares] = await Promise.all([
      sql`SELECT opportunity_id, family_id, member_id, opportunity_type, title, organization, service_code, status,
        application_start_at, application_deadline_at, form_url, eligibility_summary, preparation_notes, created_at, updated_at
        FROM ycm_customer_opportunities
        WHERE family_id=${familyId}
        ORDER BY application_deadline_at NULLS LAST, updated_at DESC
        LIMIT 200`,
      sql`SELECT note_id, family_id, member_id, author_user_id, note_type, title, content, visibility, created_at, updated_at
        FROM ycm_customer_notes
        WHERE family_id=${familyId} AND visibility IN ('employee','manager')
        ORDER BY created_at DESC
        LIMIT 200`,
      sql`SELECT share_id, share_type, title, target, expires_at, created_at
        FROM ycm_customer_shares
        WHERE family_id=${familyId} AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at>NOW())
        ORDER BY created_at DESC
        LIMIT 100`
    ]);
    return NextResponse.json({ success: true, profile: { opportunities, notes, shares } });
  } finally {
    await sql.end({ timeout: 3 });
  }
}

export async function POST(r: NextRequest) {
  const s = verifySession(r.cookies.get(sessionCookieName())?.value);
  if (!s || !staff.has(s.role)) return NextResponse.json({ success: false, code: 'FORBIDDEN' }, { status: 403 });

  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    const b = await r.json().catch(() => null) as Record<string, unknown> | null;
    const familyId = text(b?.familyId, 120);
    const action = text(b?.action, 30);
    if (!familyId || !action || !['opportunity', 'note', 'share'].includes(action)) {
      return NextResponse.json({ success: false, code: 'PROFILE_ACTION_INVALID' }, { status: 400 });
    }
    if (!(await allowedFamily(sql, s.role, s.sub, familyId))) {
      return NextResponse.json({ success: false, code: 'FAMILY_SCOPE_DENIED' }, { status: 403 });
    }

    if (action === 'opportunity') {
      const title = text(b?.title, MAX_TITLE);
      const opportunityType = text(b?.opportunityType, 30) || 'other';
      const status = text(b?.status, 30) || 'active';
      const formUrl = safeHttpUrl(b?.formUrl);
      const metadata = jsonObject(b?.metadata);
      const organization = text(b?.organization, MAX_TITLE);
      const serviceCode = text(b?.serviceCode, 100);
      const eligibilitySummary = text(b?.eligibilitySummary);
      const preparationNotes = text(b?.preparationNotes);
      if (!title) return NextResponse.json({ success: false, code: 'TITLE_REQUIRED' }, { status: 400 });
      if (!opportunityTypes.has(opportunityType) || !opportunityStatuses.has(status)) {
        return NextResponse.json({ success: false, code: 'OPPORTUNITY_VALUE_INVALID' }, { status: 400 });
      }
      if (b?.formUrl && !formUrl) return NextResponse.json({ success: false, code: 'FORM_URL_INVALID' }, { status: 400 });
      if (metadata === null) return NextResponse.json({ success: false, code: 'METADATA_INVALID' }, { status: 400 });

      const row = (await sql`INSERT INTO ycm_customer_opportunities
        (family_id,member_id,opportunity_type,title,organization,service_code,status,application_start_at,
         application_deadline_at,form_url,eligibility_summary,preparation_notes,metadata,created_by_user_id)
        VALUES (${familyId},${text(b?.memberId,120)},${opportunityType},${title},${organization},${serviceCode},
          ${status},${text(b?.applicationStartAt,80)},${text(b?.applicationDeadlineAt,80)},${formUrl},
          ${eligibilitySummary},${preparationNotes},${JSON.stringify(metadata)}::jsonb,${s.sub})
        RETURNING *`)[0];
      return NextResponse.json({ success: true, opportunity: row }, { status: 201 });
    }

    if (action === 'note') {
      const title = text(b?.title, MAX_TITLE);
      const content = text(b?.content);
      const noteType = text(b?.noteType, 30) || 'general';
      const visibility = text(b?.visibility, 20) || 'employee';
      if (!title || !content) return NextResponse.json({ success: false, code: 'NOTE_REQUIRED' }, { status: 400 });
      if (!noteTypes.has(noteType) || !noteVisibility.has(visibility)) {
        return NextResponse.json({ success: false, code: 'NOTE_VALUE_INVALID' }, { status: 400 });
      }
      if (visibility === 'manager' && !managers.has(s.role)) {
        return NextResponse.json({ success: false, code: 'MANAGER_VISIBILITY_REQUIRED' }, { status: 403 });
      }

      const row = (await sql`INSERT INTO ycm_customer_notes
        (family_id,member_id,author_user_id,note_type,title,content,visibility)
        VALUES (${familyId},${text(b?.memberId,120)},${s.sub},${noteType},${title},${content},${visibility})
        RETURNING *`)[0];
      return NextResponse.json({ success: true, note: row }, { status: 201 });
    }

    const title = text(b?.title, MAX_TITLE);
    const payload = jsonObject(b?.payload);
    const shareType = text(b?.shareType, 30) || 'note';
    const target = text(b?.target, 20) || 'customer';
    if (!title) return NextResponse.json({ success: false, code: 'TITLE_REQUIRED' }, { status: 400 });
    if (!shareTypes.has(shareType) || !shareTargets.has(target) || payload === null) {
      return NextResponse.json({ success: false, code: 'SHARE_VALUE_INVALID' }, { status: 400 });
    }
    if (target === 'manager' && !managers.has(s.role)) {
      return NextResponse.json({ success: false, code: 'MANAGER_TARGET_REQUIRED' }, { status: 403 });
    }

    const row = (await sql`INSERT INTO ycm_customer_shares
      (family_id,member_id,created_by_user_id,share_type,title,payload,target,expires_at)
      VALUES (${familyId},${text(b?.memberId,120)},${s.sub},${shareType},${title},${JSON.stringify(payload)}::jsonb,${target},${text(b?.expiresAt,80)})
      RETURNING share_id,share_type,title,target,expires_at,created_at`)[0];
    return NextResponse.json({ success: true, share: row }, { status: 201 });
  } finally {
    await sql.end({ timeout: 3 });
  }
}
