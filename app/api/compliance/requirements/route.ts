import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const staff=new Set(['employee','team_lead','branch_manager','management','ceo','admin']);
const privileged=new Set(['team_lead','branch_manager','management','ceo','admin']);

function actor(r:NextRequest){return verifySession(r.cookies.get(sessionCookieName())?.value);}

export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const familyId=r.nextUrl.searchParams.get('familyId')||null;
 const status=r.nextUrl.searchParams.get('status')||null;
 const dueOnly=r.nextUrl.searchParams.get('dueOnly')==='true';
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  if(familyId && !staff.has(s.role) && s.familyId!==familyId)return NextResponse.json({success:false,code:'FAMILY_ACCESS_DENIED'},{status:403});
  const effectiveFamily=familyId||(s.role==='family'?s.familyId:null);
  const rows=effectiveFamily
   ?await sql`SELECT cs.*,f.state_code,f.district_code,f.block_code,f.village_code,
       m.full_name AS member_name,
       d.document_type,d.valid_from,d.valid_until,d.status AS document_status
       FROM ycm_compliance_schedules cs
       JOIN ycm_families f ON f.family_id=cs.family_id
       LEFT JOIN ycm_family_members m ON m.member_id=cs.member_id
       LEFT JOIN ycm_family_documents d ON d.document_id=cs.document_id
       WHERE cs.family_id=${effectiveFamily}
         AND (${status} IS NULL OR cs.status=${status})
         AND (${!dueOnly} OR cs.next_due_at<=NOW()+(${30}::int || ' days')::interval)
       ORDER BY cs.next_due_at ASC`
   :await sql`SELECT cs.*,f.state_code,f.district_code,f.block_code,f.village_code,
       m.full_name AS member_name,d.document_type,d.valid_from,d.valid_until,d.status AS document_status
       FROM ycm_compliance_schedules cs
       JOIN ycm_families f ON f.family_id=cs.family_id
       LEFT JOIN ycm_family_members m ON m.member_id=cs.member_id
       LEFT JOIN ycm_family_documents d ON d.document_id=cs.document_id
       WHERE (${s.role==='employee'} AND cs.assigned_employee_id=(SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1))
          OR (${privileged.has(s.role)} AND (${s.role} IN ('ceo','management','admin') OR cs.assigned_manager_id=(SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1)))
       ORDER BY cs.next_due_at ASC LIMIT 1000`;
  return NextResponse.json({success:true,schedules:rows});
 }finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as Record<string,unknown>|null;
 const familyId=typeof b?.familyId==='string'?b.familyId.trim():'';
 if(!familyId)return NextResponse.json({success:false,code:'FAMILY_ID_REQUIRED'},{status:400});
 if(!staff.has(s.role)&&s.familyId!==familyId)return NextResponse.json({success:false,code:'FAMILY_ACCESS_DENIED'},{status:403});
 const requirementType=String(b?.requirementType||'').trim();
 const requirementCode=String(b?.requirementCode||'').trim();
 const title=String(b?.title||'').trim();
 const nextDueAt=String(b?.nextDueAt||'').trim();
 const frequencyDays=b?.frequencyDays==null?null:Number(b.frequencyDays);
 const warningDays=b?.warningDays==null?30:Number(b.warningDays);
 if(!['document','kyc'].includes(requirementType)||!requirementCode||!title||!nextDueAt||Number.isNaN(Date.parse(nextDueAt))||
    (frequencyDays!==null&&(!Number.isInteger(frequencyDays)||frequencyDays<=0))||!Number.isInteger(warningDays)||warningDays<0)
   return NextResponse.json({success:false,code:'COMPLIANCE_INPUT_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const actorId=(await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0]?.id||null;
  let employeeId=typeof b?.assignedEmployeeId==='string'?b.assignedEmployeeId:null;
  let managerId=typeof b?.assignedManagerId==='string'?b.assignedManagerId:null;
  if(!employeeId&&s.role==='employee')employeeId=actorId;
  if(!managerId&&['team_lead','branch_manager'].includes(s.role))managerId=actorId;
  if(employeeId&&!(await sql`SELECT 1 FROM ycm_users WHERE id=${employeeId} AND role='employee' LIMIT 1`)[0])employeeId=null;
  if(managerId&&!(await sql`SELECT 1 FROM ycm_users WHERE id=${managerId} AND role IN ('team_lead','branch_manager','management','ceo','admin') LIMIT 1`)[0])managerId=null;
  const row=(await sql`INSERT INTO ycm_compliance_schedules
    (family_id,member_id,document_id,verification_id,requirement_type,requirement_code,title,frequency_days,next_due_at,warning_days,assigned_employee_id,assigned_manager_id,metadata)
    VALUES(${familyId},${typeof b?.memberId==='string'?b.memberId:null},${typeof b?.documentId==='string'?b.documentId:null},${typeof b?.verificationId==='string'?b.verificationId:null},
      ${requirementType},${requirementCode},${title},${frequencyDays},${nextDueAt},${warningDays},${employeeId},${managerId},${JSON.stringify(b?.metadata||{})}::jsonb)
    RETURNING *`)[0];
  return NextResponse.json({success:true,schedule:row},{status:201});
 }finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!staff.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const b=await r.json().catch(()=>null) as Record<string,unknown>|null;
 const scheduleId=typeof b?.scheduleId==='string'?b.scheduleId.trim():'';
 if(!scheduleId)return NextResponse.json({success:false,code:'SCHEDULE_ID_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const current=(await sql`SELECT * FROM ycm_compliance_schedules WHERE schedule_id=${scheduleId} LIMIT 1`)[0];
  if(!current)return NextResponse.json({success:false,code:'SCHEDULE_NOT_FOUND'},{status:404});
  if(s.role==='employee'&&String(current.assigned_employee_id)!==String((await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0]?.id||''))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
  if(['team_lead','branch_manager'].includes(s.role)&&current.assigned_manager_id!==((await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0]?.id||null))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
  const status=typeof b?.status==='string'?b.status:current.status;
  const nextDueAt=typeof b?.nextDueAt==='string'?b.nextDueAt:null;
  const complete=b?.complete===true;
  const nextStatus=complete?'completed':status;
  const computedNextDueAt=complete&&nextDueAt?nextDueAt:complete&&current.frequency_days
    ?new Date(Date.now()+Number(current.frequency_days)*86400000).toISOString():nextDueAt;
  const row=(await sql`UPDATE ycm_compliance_schedules SET
    status=${nextStatus},
    next_due_at=COALESCE(${computedNextDueAt},next_due_at),
    last_completed_at=CASE WHEN ${complete} THEN NOW() ELSE last_completed_at END,
    updated_at=NOW()
    WHERE schedule_id=${scheduleId} RETURNING *`)[0];
  return NextResponse.json({success:true,schedule:row});
 }finally{await sql.end({timeout:3});}
}
