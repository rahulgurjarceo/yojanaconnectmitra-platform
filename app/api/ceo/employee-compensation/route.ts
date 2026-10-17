/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const dateOk=(v:string|null)=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v);
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!['ceo','admin','management'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const u=new URL(r.url),employee=u.searchParams.get('employeeId'),from=u.searchParams.get('from'),to=u.searchParams.get('to');
 if(!dateOk(from)||!dateOk(to))return NextResponse.json({success:false,code:'INVALID_DATE_RANGE'},{status:400});
 try{
  const [people,comp,targets,comm,attendance,work]=await Promise.all([
   sql`SELECT id,user_id,full_name,email,mobile,status FROM ycm_users WHERE role='employee' AND status<>'disabled' AND (${employee} IS NULL OR id=${employee}::uuid) ORDER BY full_name`,
   sql`SELECT * FROM ycm_employee_compensation WHERE status='active'`,
   sql`SELECT employee_user_id,COALESCE(SUM(target_value),0)::numeric target_value,COUNT(*)::int target_count FROM ycm_employee_targets WHERE status='active' AND (${from} IS NULL OR period_end>=${from}::date) AND (${to} IS NULL OR period_start<=${to}::date) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COALESCE(SUM(amount) FILTER(WHERE status IN ('pending','approved','paid')),0)::numeric earned_commission,COALESCE(SUM(amount) FILTER(WHERE status='paid'),0)::numeric paid_commission,COUNT(*)::int commission_entries FROM ycm_employee_commission WHERE (${from} IS NULL OR earned_at>=${from}::timestamptz) AND (${to} IS NULL OR earned_at<(${to}::date+1)::timestamptz) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COUNT(*) FILTER(WHERE status='present')::int present_days,COUNT(*) FILTER(WHERE status='absent')::int absent_days,COUNT(*) FILTER(WHERE status='half_day')::int half_days,COUNT(*) FILTER(WHERE status='leave')::int leave_days,COALESCE(SUM(worked_seconds),0)::int worked_seconds FROM ycm_employee_attendance WHERE (${from} IS NULL OR attendance_date>=${from}::date) AND (${to} IS NULL OR attendance_date<=${to}::date) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COALESCE(SUM(tasks_assigned),0)::int tasks_assigned,COALESCE(SUM(tasks_completed),0)::int tasks_completed,COALESCE(SUM(applications_processed),0)::int applications_processed,COALESCE(SUM(customers_served),0)::int customers_served FROM ycm_employee_daily_kpi WHERE (${from} IS NULL OR metric_date>=${from}::date) AND (${to} IS NULL OR metric_date<=${to}::date) GROUP BY employee_user_id`
  ]);
  const map=new Map(people.map((p:any)=>[p.id,{...p}]));
  for(const [rows,key] of [[comp,'compensation'],[targets,'targets'],[comm,'commission'],[attendance,'attendance'],[work,'work']] as const)for(const x of rows as any[]){const id=x.employee_user_id;const e=map.get(id);if(e)e[key]=x;}
  for(const e of map.values()){const target=Number(e.targets?.target_value||0),completed=Number(e.work?.tasks_completed||0),assigned=Number(e.work?.tasks_assigned||0),present=Number(e.attendance?.present_days||0),absent=Number(e.attendance?.absent_days||0),half=Number(e.attendance?.half_days||0);e.performance={target_achievement_pct:target>0?Math.round(completed/target*1000)/10:null,task_completion_pct:assigned>0?Math.round(completed/assigned*1000)/10:null,attendance_days:present+absent+half,attendance_pct:(present+absent+half)>0?Math.round((present+half*0.5)/(present+absent+half)*1000)/10:null,worked_hours:Math.round(Number(e.attendance?.worked_seconds||0)/3600*10)/10};}
  return NextResponse.json({success:true,employees:[...map.values()]});
 }catch(e){return NextResponse.json({success:false,code:'EMPLOYEE_COMPENSATION_QUERY_FAILED'},{status:500});}
}
