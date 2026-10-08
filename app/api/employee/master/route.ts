import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false}):null};
const managementRoles=new Set(['team_lead','branch_manager','management','admin','ceo']);
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s||!managementRoles.has(s.role))return NextResponse.json({success:false,code:'MANAGEMENT_ONLY'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const employeeId=r.nextUrl.searchParams.get('employeeId')||s.userId;
  const months=Math.max(1,Math.min(12,Number(r.nextUrl.searchParams.get('months')||12)));
  const [employee,performance,followups,projects,weights,slabs]=await Promise.all([
   sql`SELECT u.id,u.user_id,u.role,u.status,c.monthly_salary,c.salary_currency,c.effective_from,c.effective_to FROM ycm_users u LEFT JOIN ycm_employee_compensation c ON c.employee_user_id=u.id AND c.status='active' WHERE u.id=${employeeId} LIMIT 1`,
   sql`SELECT * FROM ycm_employee_performance_monthly WHERE employee_user_id=${employeeId} ORDER BY month_start DESC LIMIT ${months}`,
   sql`SELECT f.*,l.name lead_name,l.mobile FROM ycm_employee_followups f LEFT JOIN ycm_leads l ON l.lead_id=f.lead_id WHERE f.employee_user_id=${employeeId} AND f.status IN ('pending','overdue') ORDER BY f.due_at ASC LIMIT 50`,
   sql`SELECT p.project_id,p.project_code,p.project_name,p.status,p.priority,p.start_date,p.due_date,p.completion_percent,m.responsibility,m.target_value,m.actual_value FROM ycm_employee_project_members m JOIN ycm_employee_projects p ON p.project_id=m.project_id WHERE m.employee_user_id=${employeeId} AND m.status='active' ORDER BY p.due_date NULLS LAST LIMIT 50`,
   sql`SELECT weight_code,weight_percent FROM ycm_employee_performance_weights WHERE active=true ORDER BY weight_code`,
   sql`SELECT slab_code,min_score,max_score,contribution_percent,reward_multiplier,sort_order,notes FROM ycm_employee_contribution_slabs WHERE active=true ORDER BY sort_order`
  ]);
  return NextResponse.json({success:true,employee:employee[0]||null,performance,followups,projects,weights,contributionSlabs:slabs});
 }catch{return NextResponse.json({success:false,code:'EMPLOYEE_MASTER_LOAD_FAILED'},{status:400})}
 finally{await sql.end({timeout:3})}
}