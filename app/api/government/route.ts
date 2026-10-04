import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySession } from '../../lib/ycm-access-control';
import { GOVERNMENT_GRIEVANCE_CATEGORIES, GOVERNMENT_GRIEVANCE_SAFETY_RULES, normalizeGrievanceText } from '../../lib/ycm-government-grievance';
import { governmentScopeAllows } from '../../lib/ycm-government-rbac';

export const runtime = 'nodejs';
const db = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 6, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ success:false, code:'AUTHENTICATION_REQUIRED' }, { status:401 });
  const sql = db();
  if (!sql) return NextResponse.json({ success:false, code:'DATABASE_NOT_CONFIGURED' }, { status:503 });
  const p=request.nextUrl.searchParams;
  const stateCode=p.get('stateCode'), districtCode=p.get('districtCode'), blockCode=p.get('blockCode');
  const gpCode=p.get('gramPanchayatCode'), villageCode=p.get('villageCode'), departmentCode=p.get('departmentCode');
  if (session.role === 'branch_manager') {
    if (!stateCode || !districtCode) return NextResponse.json({success:false,code:'GOVERNMENT_SCOPE_REQUIRED'},{status:403});
    const allowed = await governmentScopeAllows(session, {
      geographyLevel: blockCode ? 'block' : 'district', stateCode, districtCode, blockCode,
      gramPanchayatCode: gpCode, villageCode, wardCode: null,
    });
    if (!allowed) return NextResponse.json({success:false,code:'GOVERNMENT_SCOPE_DENIED'},{status:403});
  }
  try {
    const contacts=await sql.unsafe(
      `SELECT contact_id,jurisdiction_level,department_code,department_name,designation,officer_name,
        official_phone,official_email,official_website,grievance_url,anti_corruption,emergency,
        source_url,source_name,verification_status,verified_at,valid_until
       FROM ycm_government_contacts
       WHERE verification_status='verified'
         AND ($1::text IS NULL OR state_code=$1 OR state_code IS NULL)
         AND ($2::text IS NULL OR district_code=$2 OR district_code IS NULL)
         AND ($3::text IS NULL OR block_code=$3 OR block_code IS NULL)
         AND ($4::text IS NULL OR gram_panchayat_code=$4 OR gram_panchayat_code IS NULL)
         AND ($5::text IS NULL OR village_code=$5 OR village_code IS NULL)
         AND ($6::text IS NULL OR department_code=$6)
         AND (valid_until IS NULL OR valid_until>=CURRENT_DATE)
       ORDER BY jurisdiction_level,department_name,designation,officer_name NULLS LAST`,
      [stateCode,districtCode,blockCode,gpCode,villageCode,departmentCode]
    );
    const cases=await sql.unsafe(
      `SELECT case_id,title,category,department_code,allegation_type,official_channel,official_reference,status,submitted_at,resolved_at,created_at,updated_at
       FROM ycm_government_grievance_cases
       WHERE user_id=(SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1)
       ORDER BY created_at DESC LIMIT 100`, [session.sub]
    );
    return NextResponse.json({success:true,contacts,cases,policy:GOVERNMENT_GRIEVANCE_SAFETY_RULES});
  } finally { await sql.end({timeout:3}); }
}

export async function POST(request: NextRequest) {
  const session=verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const title=normalizeGrievanceText(body?.title,180), description=normalizeGrievanceText(body?.description,10000);
  const category=normalizeGrievanceText(body?.category,80), allegationType=normalizeGrievanceText(body?.allegationType,40)??'service_issue';
  if(!title||!description||!category) return NextResponse.json({success:false,code:'GRIEVANCE_FIELDS_REQUIRED'},{status:400});
  if(!(GOVERNMENT_GRIEVANCE_CATEGORIES as readonly string[]).includes(category)) return NextResponse.json({success:false,code:'GRIEVANCE_CATEGORY_INVALID'},{status:400});
  if(!['service_issue','delay','refusal','document_issue','misconduct','bribery_report','other'].includes(allegationType)) return NextResponse.json({success:false,code:'GRIEVANCE_ALLEGATION_TYPE_INVALID'},{status:400});
  if (session.role === 'branch_manager') {
    const stateCode = normalizeGrievanceText(body?.stateCode,20);
    const districtCode = normalizeGrievanceText(body?.districtCode,40);
    const blockCode = normalizeGrievanceText(body?.blockCode,40);
    if (!stateCode || !districtCode) return NextResponse.json({success:false,code:'GOVERNMENT_SCOPE_REQUIRED'},{status:403});
    try {
      const allowed = await governmentScopeAllows(session, { geographyLevel: blockCode ? 'block' : 'district', stateCode, districtCode, blockCode });
      if (!allowed) return NextResponse.json({success:false,code:'GOVERNMENT_SCOPE_DENIED'},{status:403});
    } catch (error) {
      return NextResponse.json({success:false,code:error instanceof Error ? error.message : 'GOVERNMENT_SCOPE_CHECK_FAILED'},{status:503});
    }
  }
  const sql=db(); if(!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
  try {
    const result=await sql.begin(async tx=>{
      const user=(await tx.unsafe('SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1',[session.sub]))[0];
      if(!user) throw new Error('USER_NOT_FOUND');
      const caseId=randomUUID();
      const vals=[
        caseId,user.id,title,description,category,normalizeGrievanceText(body?.departmentCode,80),
        normalizeGrievanceText(body?.jurisdictionLevel,30),normalizeGrievanceText(body?.stateCode,20),
        normalizeGrievanceText(body?.districtCode,40),normalizeGrievanceText(body?.blockCode,40),
        normalizeGrievanceText(body?.gramPanchayatCode,40),normalizeGrievanceText(body?.villageCode,40),
        normalizeGrievanceText(body?.targetContactId,80),allegationType,normalizeGrievanceText(body?.officialChannel,120)
      ];
      const row=(await tx.unsafe(
        `INSERT INTO ycm_government_grievance_cases
        (case_id,user_id,title,description,category,department_code,jurisdiction_level,state_code,district_code,block_code,gram_panchayat_code,village_code,target_contact_id,allegation_type,official_channel,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'draft')
        RETURNING case_id,title,category,allegation_type,status,created_at`,vals))[0];
      await tx.unsafe(
        'INSERT INTO ycm_government_grievance_events(event_id,case_id,event_type,note,created_by) VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(),caseId,'CASE_CREATED',GOVERNMENT_GRIEVANCE_SAFETY_RULES.allegationDisclaimer,user.id]
      );
      return row;
    });
    return NextResponse.json({success:true,grievanceCase:result},{status:201});
  } catch(error) {
    return NextResponse.json({success:false,code:error instanceof Error?error.message:'GRIEVANCE_CREATE_FAILED'},{status:400});
  } finally { await sql.end({timeout:3}); }
}
