import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
import {assertCompanyFinanceRole} from '../../../../lib/ycm-company-financial-control';
import {buildAuditRecord} from '../../../../lib/ycm-audit-events';
import {getPostgresYcmAuditStore} from '../../../../lib/ycm-postgres-audit-store';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};

export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();
 if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  assertCompanyFinanceRole(s.role);
  const rows=await sql`SELECT COUNT(*)::int AS ledger_transactions,COALESCE(SUM(gross_amount_paise),0)::bigint AS ledger_gross_paise,COUNT(*) FILTER(WHERE state IN ('success','reconciled'))::int AS successful_transactions,COALESCE(SUM(gross_amount_paise) FILTER(WHERE state IN ('success','reconciled')),0)::bigint AS successful_gross_paise FROM ycm_financial_transactions`;
  const settlements=await sql`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='paid')::int AS paid,COUNT(*) FILTER(WHERE status IN ('requested','approved','processing'))::int AS pending,COALESCE(SUM(amount_paise) FILTER(WHERE status='paid'),0)::bigint AS paid_paise FROM ycm_settlements`;
  const audit=getPostgresYcmAuditStore();
  if(audit)await audit.append(buildAuditRecord({event:'FINANCIAL_RECONCILIATION_REVIEWED',subject:s.sub,role:s.role,sessionId:s.sessionId,resourceType:'company_financial_reconciliation',resourceId:'global',success:true})).catch(()=>{});
  return NextResponse.json({success:true,ledger:rows[0],settlements:settlements[0]},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){
  const code=e instanceof Error?e.message:'RECONCILIATION_FAILED';
  return NextResponse.json({success:false,code},{status:code==='FORBIDDEN'?403:500});
 }finally{
  await sql.end({timeout:3});
 }
}
