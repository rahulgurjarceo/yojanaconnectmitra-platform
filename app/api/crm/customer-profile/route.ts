import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../../lib/ycm-access-control';
export const runtime = 'nodejs';
const db = () => { const u=process.env.DATABASE_URL||process.env.POSTGRES_URL; return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null; };
const staff=new Set(['employee','team_lead','branch_manager','management','ceo','admin']);
async function allowedFamily(sql:ReturnType<typeof postgres>,role:string,userId:string,familyId:string){
 if(['team_lead','branch_manager','management','ceo','admin'].includes(role)) return true;
 const row=(await sql`SELECT 1 FROM ycm_leads l JOIN ycm_users u ON u.id=l.assigned_to WHERE u.user_id=${userId} AND l.family_id=${familyId} LIMIT 1`)[0];
 return !!row;
}
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s||!staff.has(s.role)) return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const familyId=new URL(r.url).searchParams.get('familyId'); if(!familyId) return NextResponse.json({success:false,code:'FAMILY_ID_REQUIRED'},{status:400});
 const sql=db(); if(!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  if(!(await allowedFamily(sql,s.role,s.sub,familyId))) return NextResponse.json({success:false,code:'FAMILY_SCOPE_DENIED'},{status:403});
  const [opportunities,notes,shares]=await Promise.all([
   sql`SELECT * FROM ycm_customer_opportunities WHERE family_id=${familyId} ORDER BY application_deadline_at NULLS LAST,updated_at DESC LIMIT 200`,
   sql`SELECT * FROM ycm_customer_notes WHERE family_id=${familyId} AND visibility IN ('employee','manager') ORDER BY created_at DESC LIMIT 200`,
   sql`SELECT share_id,share_type,title,target,expires_at,created_at FROM ycm_customer_shares WHERE family_id=${familyId} AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>NOW()) ORDER BY created_at DESC LIMIT 100`
  ]);
  return NextResponse.json({success:true,profile:{opportunities,notes,shares}});
 }finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value); if(!s||!staff.has(s.role)) return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db(); if(!sql) return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json().catch(()=>null) as any, familyId=String(b?.familyId||'').trim();
  if(!familyId||!['opportunity','note','share'].includes(b?.action)) return NextResponse.json({success:false,code:'PROFILE_ACTION_INVALID'},{status:400});
  if(!(await allowedFamily(sql,s.role,s.sub,familyId))) return NextResponse.json({success:false,code:'FAMILY_SCOPE_DENIED'},{status:403});
  if(b.action==='opportunity'){
   const title=String(b.title||'').trim(); if(!title) return NextResponse.json({success:false,code:'TITLE_REQUIRED'},{status:400});
   const row=(await sql`INSERT INTO ycm_customer_opportunities(family_id,member_id,opportunity_type,title,organization,service_code,status,application_start_at,application_deadline_at,form_url,eligibility_summary,preparation_notes,metadata,created_by_user_id) VALUES(${familyId},${b.memberId||null},${b.opportunityType||'other'},${title},${b.organization||null},${b.serviceCode||null},${b.status||'active'},${b.applicationStartAt||null},${b.applicationDeadlineAt||null},${b.formUrl||null},${b.eligibilitySummary||null},${b.preparationNotes||null},${b.metadata||{}},${s.sub}) RETURNING *`)[0];
   return NextResponse.json({success:true,opportunity:row},{status:201});
  }
  if(b.action==='note'){
   const title=String(b.title||'').trim(),content=String(b.content||'').trim(); if(!title||!content) return NextResponse.json({success:false,code:'NOTE_REQUIRED'},{status:400});
   const row=(await sql`INSERT INTO ycm_customer_notes(family_id,member_id,author_user_id,note_type,title,content,visibility) VALUES(${familyId},${b.memberId||null},${s.sub},${b.noteType||'general'},${title},${content},${b.visibility||'employee'}) RETURNING *`)[0];
   return NextResponse.json({success:true,note:row},{status:201});
  }
  const title=String(b.title||'').trim(); if(!title) return NextResponse.json({success:false,code:'TITLE_REQUIRED'},{status:400});
  const row=(await sql`INSERT INTO ycm_customer_shares(family_id,member_id,created_by_user_id,share_type,title,payload,target,expires_at) VALUES(${familyId},${b.memberId||null},${s.sub},${b.shareType||'note'},${title},${b.payload||{}},${b.target||'customer'},${b.expiresAt||null}) RETURNING share_id,share_type,title,target,expires_at,created_at`)[0];
  return NextResponse.json({success:true,share:row},{status:201});
 }finally{await sql.end({timeout:3});}
}
