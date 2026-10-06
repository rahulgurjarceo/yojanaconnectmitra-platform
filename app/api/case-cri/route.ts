import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { verifySession, sessionCookieName } from '../../lib/ycm-access-control';
import { calculateCri, CRI_DIMENSIONS, CRI_WEIGHTS, type CriInput } from '../../lib/ycm-cri';

export const runtime = 'nodejs';
const db = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 4, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};

function clamp(value: unknown) { return Math.max(0, Math.min(100, Number(value) || 0)); }

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
  const body = await request.json().catch(() => null) as Record<string,unknown>|null;
  const caseId = typeof body?.caseId === 'string' ? body.caseId.trim() : '';
  if (!caseId) return NextResponse.json({success:false,code:'CASE_ID_REQUIRED'},{status:400});
  const sql = db(); if (!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  try {
    const row = (await sql`SELECT case_id,family_id FROM ycm_family_cases WHERE case_id=${caseId} LIMIT 1`)[0] as {case_id:string;family_id:string}|undefined;
    if (!row) return NextResponse.json({success:false,code:'CASE_NOT_FOUND'},{status:404});
    const privileged = ['ceo','admin','management'].includes(session.role);
    if (!privileged && session.familyId !== row.family_id) return NextResponse.json({success:false,code:'CASE_ACCESS_DENIED'},{status:403});
    const input = Object.fromEntries(CRI_DIMENSIONS.map(key => [key, clamp(body?.[key])])) as CriInput;
    const result = calculateCri(input);
    const reasons = CRI_DIMENSIONS
      .filter(key => input[key] < 60)
      .map(key => ({ dimension:key, score:input[key], weight:CRI_WEIGHTS[key], reason: `${key} is below 60` }));
    await sql`INSERT INTO ycm_case_cri(case_id,tat_score,documents_score,payment_score,employee_score,authority_score,office_visits_score,government_visits_score,followups_score,rework_score,progress_score,outcome_score,satisfaction_score,cri_score,risk_band,blocking_reasons,updated_at)
      VALUES(${caseId},${input.tat},${input.documents},${input.payment},${input.employee},${input.authority},${input.officeVisits},${input.governmentVisits},${input.followups},${input.rework},${input.progress},${input.outcome},${input.satisfaction},${result.score},${result.band},${JSON.stringify(reasons)}::jsonb,NOW())
      ON CONFLICT(case_id) DO UPDATE SET tat_score=EXCLUDED.tat_score,documents_score=EXCLUDED.documents_score,payment_score=EXCLUDED.payment_score,employee_score=EXCLUDED.employee_score,authority_score=EXCLUDED.authority_score,office_visits_score=EXCLUDED.office_visits_score,government_visits_score=EXCLUDED.government_visits_score,followups_score=EXCLUDED.followups_score,rework_score=EXCLUDED.rework_score,progress_score=EXCLUDED.progress_score,outcome_score=EXCLUDED.outcome_score,satisfaction_score=EXCLUDED.satisfaction_score,cri_score=EXCLUDED.cri_score,risk_band=EXCLUDED.risk_band,blocking_reasons=EXCLUDED.blocking_reasons,updated_at=NOW()`;
    return NextResponse.json({success:true,caseId,cri:result.score,band:result.band,blockingReasons:reasons,weights:CRI_WEIGHTS});
  } finally { await sql.end({timeout:3}); }
}

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
  const caseId = new URL(request.url).searchParams.get('caseId')?.trim() || '';
  const sql = db(); if (!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  try {
    if (caseId) {
      const row = (await sql`SELECT c.case_id,c.family_id,c.status,c.case_category_name,cri.* FROM ycm_family_cases c LEFT JOIN ycm_case_cri cri ON cri.case_id=c.case_id WHERE c.case_id=${caseId} LIMIT 1`)[0] as Record<string,unknown>|undefined;
      if (!row) return NextResponse.json({success:false,code:'CASE_NOT_FOUND'},{status:404});
      if (!['ceo','admin','management'].includes(session.role) && session.familyId !== row.family_id) return NextResponse.json({success:false,code:'CASE_ACCESS_DENIED'},{status:403});
      return NextResponse.json({success:true,case:row});
    }
    if (!['ceo','admin','management'].includes(session.role)) return NextResponse.json({success:false,code:'MANAGEMENT_ACCESS_REQUIRED'},{status:403});
    const rows = await sql`SELECT cri.case_id,c.family_id,c.case_category_name,c.status,cri.cri_score,cri.risk_band,cri.blocking_reasons,cri.updated_at FROM ycm_case_cri cri JOIN ycm_family_cases c ON c.case_id=cri.case_id ORDER BY cri.cri_score ASC,cri.updated_at DESC LIMIT 200`;
    return NextResponse.json({success:true,summary:{total:rows.length,excellent:rows.filter(x=>x.risk_band==='excellent').length,attentionRequired:rows.filter(x=>x.risk_band==='attention_required').length,atRisk:rows.filter(x=>x.risk_band==='at_risk').length},cases:rows});
  } finally { await sql.end({timeout:3}); }
}
