import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';
export const runtime = 'nodejs';
const allowed = ['ceo', 'admin', 'management'] as const;
const db = () => { const url = process.env.DATABASE_URL || process.env.POSTGRES_URL; return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null; };
const auth = (r: NextRequest) => { const s = verifySession(r.cookies.get(sessionCookieName())?.value); return s && allowed.includes(s.role as (typeof allowed)[number]) ? s : null; };
const error = (code: string, status: number) => NextResponse.json({ success: false, code }, { status });
export async function GET(r: NextRequest) {
 const s=auth(r); if(!s)return error('FORBIDDEN_ROLE_SCOPE',403);
 const u=new URL(r.url),studentRef=u.searchParams.get('studentRef'),district=u.searchParams.get('district'),block=u.searchParams.get('block'),sql=db();
 if(!sql)return error('DATABASE_NOT_CONFIGURED',503);
 try { const rows=await sql`SELECT m.measurement_id,m.impact_id,m.student_ref,m.institution_ref,m.subject,m.grade_level,m.baseline_value,m.intervention_value,m.followup_value,m.unit,m.baseline_date,m.intervention_date,m.followup_date,m.evidence_required,m.verification_status,m.methodology_note,i.state_code,i.district_code,i.block_code,i.village_code,i.verified,i.consent_captured FROM ycm_education_measurements m JOIN ycm_impact_records i ON i.impact_id=m.impact_id WHERE i.consent_captured=true AND (${studentRef} IS NULL OR m.student_ref=${studentRef}) AND (${district} IS NULL OR i.district_code=${district}) AND (${block} IS NULL OR i.block_code=${block}) ORDER BY m.baseline_date DESC,m.created_at DESC LIMIT 500`; return NextResponse.json({success:true,rows}); } catch { return error('EDUCATION_MEASUREMENT_QUERY_FAILED',500); } finally { await sql.end({timeout:3}); }
}
export async function POST(r: NextRequest) {
 const s=auth(r); if(!s)return error('FORBIDDEN_ROLE_SCOPE',403);
 const b=await r.json().catch(()=>null) as {impactId?:string;studentRef?:string;institutionRef?:string;subject?:string;gradeLevel?:string;baselineValue?:number;interventionValue?:number;followupValue?:number;unit?:string;baselineDate?:string;interventionDate?:string;followupDate?:string;evidenceRequired?:boolean;verificationStatus?:'pending'|'verified'|'rejected';methodologyNote?:string;consentCaptured?:boolean}|null;
 if(!b?.impactId||!b.studentRef||b.baselineValue===undefined||!b.unit||!b.baselineDate)return error('EDUCATION_MEASUREMENT_REQUIRED_FIELDS',400);
 if(b.consentCaptured!==true)return error('EDUCATION_CONSENT_REQUIRED',400);
 const sql=db(); if(!sql)return error('DATABASE_NOT_CONFIGURED',503);
 try { const parent=(await sql`SELECT impact_id,consent_captured FROM ycm_impact_records WHERE impact_id=${b.impactId} LIMIT 1`)[0]; if(!parent||!parent.consent_captured)return error('IMPACT_PARENT_CONSENT_REQUIRED',400); const row=(await sql`INSERT INTO ycm_education_measurements(impact_id,student_ref,institution_ref,subject,grade_level,baseline_value,intervention_value,followup_value,unit,baseline_date,intervention_date,followup_date,evidence_required,verification_status,methodology_note,consent_captured,created_by) VALUES(${b.impactId},${b.studentRef},${b.institutionRef||null},${b.subject||null},${b.gradeLevel||null},${b.baselineValue},${b.interventionValue??null},${b.followupValue??null},${b.unit},${b.baselineDate},${b.interventionDate||null},${b.followupDate||null},${b.evidenceRequired!==false},${b.verificationStatus||'pending'},${b.methodologyNote||null},true,${s.sub}) RETURNING measurement_id`)[0]; return NextResponse.json({success:true,measurementId:row.measurement_id},{status:201}); } catch { return error('EDUCATION_MEASUREMENT_CREATE_FAILED',500); } finally { await sql.end({timeout:3}); }
}