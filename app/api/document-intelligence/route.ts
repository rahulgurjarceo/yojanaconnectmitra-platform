import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
import {getOcrProvider} from '../../lib/ycm-ocr';
import {validateDocumentAgainstMember} from '../../lib/ycm-document-validation';
export const runtime='nodejs';
const getDb=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function POST(request:NextRequest){
 const s=verifySession(request.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await request.json().catch(()=>null) as {familyId?:string;memberId?:string;documentType?:string;storageRef?:string;documentVersion?:string;sha256?:string;consentAt?:string}|null;
 if(!b?.familyId||!b.documentType||!b.storageRef||!b.consentAt)return NextResponse.json({success:false,code:'DOCUMENT_FIELDS_REQUIRED'},{status:400});
 if(!['ceo','admin','management','employee','partner','referral'].includes(s.role)&&s.familyId!==b.familyId)return NextResponse.json({success:false,code:'FAMILY_ACCESS_DENIED'},{status:403});
 const sql=getDb();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const member=b.memberId?(await sql`SELECT member_id,full_name,date_of_birth FROM ycm_family_members WHERE family_id=${b.familyId} AND member_id=${b.memberId} LIMIT 1`)[0]:null;
  const d=(await sql`INSERT INTO ycm_document_intelligence(family_id,member_id,document_type,document_version,storage_ref,sha256,ocr_status,consent_at) VALUES(${b.familyId},${b.memberId||null},${b.documentType},${b.documentVersion||null},${b.storageRef},${b.sha256||null},'pending',${b.consentAt}) RETURNING document_id,family_id,member_id,document_type,ocr_status,validation_status,created_at`)[0];
  const provider=getOcrProvider();
  if(!provider){await sql`INSERT INTO ycm_document_audit_events(document_id,family_id,actor_user_id,event_type,details) VALUES(${d.document_id},${b.familyId},(SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1),'ocr_queued',${JSON.stringify({reason:'OCR_PROVIDER_NOT_CONFIGURED'})}::jsonb)`;return NextResponse.json({success:true,status:'pending',code:'OCR_PROVIDER_NOT_CONFIGURED',document:d},{status:202});}
  await sql`UPDATE ycm_document_intelligence SET ocr_status='processing',ocr_provider=${process.env.YCM_OCR||'configured'},updated_at=NOW() WHERE document_id=${d.document_id}`;
  try{
   const r=await provider.extract({documentType:b.documentType,storageRef:b.storageRef,familyId:b.familyId,memberId:b.memberId,consentAt:b.consentAt});
   const v=validateDocumentAgainstMember(r.fields,member,r.confidence),os=r.status==='failed'?'failed':v.status==='manual_review'?'manual_review':'completed';
   await sql`UPDATE ycm_document_intelligence SET ocr_provider=${r.provider},ocr_status=${os},extracted_fields=${JSON.stringify(r.fields)}::jsonb,field_confidence=${JSON.stringify(r.confidence)}::jsonb,validation_status=${v.status},validation_errors=${JSON.stringify(v.errors)}::jsonb,updated_at=NOW() WHERE document_id=${d.document_id}`;
   return NextResponse.json({success:true,status:v.status,documentId:d.document_id,ocr:r,validation:v});
  }catch(e){await sql`UPDATE ycm_document_intelligence SET ocr_status='failed',validation_status='manual_review',validation_errors=${JSON.stringify([{code:'OCR_PROVIDER_ERROR',field:'document',message:'OCR provider failed; human review required.'}])}::jsonb,updated_at=NOW() WHERE document_id=${d.document_id}`;console.error('document OCR failed',e);return NextResponse.json({success:false,code:'OCR_PROVIDER_ERROR',documentId:d.document_id},{status:502});}
 }finally{await sql.end({timeout:3});}
}
