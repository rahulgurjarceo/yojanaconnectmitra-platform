import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {assertCompanyFinanceRole} from '../../../../lib/ycm-company-financial-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 try{assertCompanyFinanceRole(s.role);const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED');const start=r.nextUrl.searchParams.get('start');const end=r.nextUrl.searchParams.get('end');
 const rows=await sql`SELECT b.period_start,b.period_end,b.category,b.budget_amount_paise,COALESCE(SUM(e.amount_paise) FILTER(WHERE e.status IN ('posted','approved')),0)::bigint actual_amount_paise, b.budget_amount_paise-COALESCE(SUM(e.amount_paise) FILTER(WHERE e.status IN ('posted','approved')),0)::bigint variance_paise FROM ycm_company_budgets b LEFT JOIN ycm_company_expenses e ON e.category=b.category AND e.expense_date BETWEEN b.period_start AND b.period_end WHERE b.status='active' AND (${start}::date IS NULL OR b.period_end>=${start}::date) AND (${end}::date IS NULL OR b.period_start<=${end}::date) GROUP BY b.period_start,b.period_end,b.category,b.budget_amount_paise ORDER BY b.period_start DESC,b.category`;
 const employee=await sql`SELECT e.employee_user_id,COALESCE(u.user_id,'') user_id,COALESCE(SUM(e.amount_paise),0)::bigint expense_paise,COUNT(*)::int expense_count FROM ycm_company_expenses e LEFT JOIN ycm_users u ON u.id=e.employee_user_id WHERE e.status IN ('posted','approved') AND e.employee_user_id IS NOT NULL GROUP BY e.employee_user_id,u.user_id ORDER BY expense_paise DESC LIMIT 500`;
 return NextResponse.json({success:true,budgetVsActual:rows,employeeExpense:employee},{headers:{'Cache-Control':'private, no-store'}});}catch(e){const code=e instanceof Error?e.message:'FINANCE_REPORT_FAILED';return NextResponse.json({success:false,code},{status:code==='FORBIDDEN'?403:500});}}
