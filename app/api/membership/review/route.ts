import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const isHighManagement=(role:string)=>role==='management'||role==='ceo';

export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!isHighManagement(s.role))return NextResponse.json({success:false,code:'HIGH_MANAGEMENT_ONLY'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const rows=await sql`SELECT m.membership_id,m.user_id,u.full_name,u.mobile,m.membership_type,m.membership_segment,m.plan_code,m.amount_paise,m.currency,m.validity_years,m.status,m.review_status,m.review_type,m.verification_reference,m.review_note,m.created_at,m.updated_at
    FROM ycm_memberships m JOIN ycm_users u ON u.id=m.user_id
    WHERE m.review_status='pending' ORDER BY m.created_at ASC LIMIT 500`;
  return NextResponse.json({success:true,queue:rows});
 }finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!isHighManagement(s.role))return NextResponse.json({success:false,code:'HIGH_MANAGEMENT_ONLY'},{status:403});
 const body=await r.json().catch(()=>null) as {membershipId?:string;decision?:'approve'|'reject';verificationReference?:string;reviewNote?:string}|null;
 if(!body?.membershipId||!body.decision)return NextResponse.json({success:false,code:'REVIEW_FIELDS_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const reviewer=(await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0]?.id;
  if(!reviewer)return NextResponse.json({success:false,code:'REVIEWER_NOT_FOUND'},{status:403});
  const membership=(await sql`SELECT membership_id,membership_segment,review_status,status FROM ycm_memberships WHERE membership_id=${body.membershipId} LIMIT 1`)[0];
  if(!membership)return NextResponse.json({success:false,code:'MEMBERSHIP_NOT_FOUND'},{status:404});
  if(membership.review_status!=='pending')return NextResponse.json({success:false,code:'MEMBERSHIP_NOT_PENDING_REVIEW'},{status:409});
  if(!['widow_household','defense_family'].includes(membership.membership_segment))return NextResponse.json({success:false,code:'SPECIAL_REVIEW_NOT_REQUIRED'},{status:400});
  const approved=body.decision==='approve';
  const updated=(await sql`UPDATE ycm_memberships SET
    review_status=${approved?'approved':'rejected'},
    validity_years=${approved?2:1},
    plan_code=${approved?(membership.membership_segment==='widow_household'?'YCM_99_WIDOW_2Y':'YCM_99_DEFENSE_2Y'):'YCM_99_1Y'},
    verification_reference=${body.verificationReference?.trim()||null},
    review_note=${body.reviewNote?.trim()||null},
    reviewed_by=${reviewer},
    reviewed_at=NOW(),
    updated_at=NOW()
    WHERE membership_id=${body.membershipId}
    RETURNING membership_id,membership_segment,plan_code,validity_years,status,review_status,review_type,verification_reference,review_note,reviewed_by,reviewed_at`)[0];
  return NextResponse.json({success:true,membership:updated});
 }finally{await sql.end({timeout:3});}
}