import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../../../lib/ycm-access-control';
import {buildAuditRecord} from '../../../../../../lib/ycm-audit-events';
import {getPostgresYcmAuditStore} from '../../../../../../lib/ycm-postgres-audit-store';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const roles=new Set(['ceo','management','admin']);
export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.has(s.role))return NextResponse.json({success:false,code:s?'FORBIDDEN':'AUTHENTICATION_REQUIRED'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as {expenseId?:string;status?:'approved'|'posted'|'cancelled'}|null;
 if(!b?.expenseId||!b.status)return NextResponse.json({success:false,code:'EXPENSE_APPROVAL_FIELDS_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const rows=await sql`UPDATE ycm_company_expenses SET status=${b.status},updated_at=NOW() WHERE expense_id=${b.expenseId} AND status IN ('draft','approved') RETURNING expense_id,status`;
 if(!rows[0])return NextResponse.json({success:false,code:'EXPENSE_NOT_APPROVABLE'},{status:409});
 const audit=getPostgresYcmAuditStore();if(audit)await audit.append(buildAuditRecord({event:'COMPANY_EXPENSE_APPROVAL_CHANGED',subject:s.sub,role:s.role,sessionId:s.sessionId,resourceType:'company_expense',resourceId:b.expenseId,success:true})).catch(()=>{});
 return NextResponse.json({success:true,expense:rows[0]});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'EXPENSE_APPROVAL_FAILED'},{status:400});}finally{await sql.end({timeout:3});}}
