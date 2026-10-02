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
  const [people,comp,targets,comm,attendance]=await Promise.all([
   sql`SELECT id,user_id,full_name,email,mobile,status FROM ycm_users WHERE role='employee' AND status<>'disabled' AND (${employee} IS NULL OR id=${employee}::uuid) ORDER BY full_name`,
   sql`SELECT * FROM ycm_employee_compensation WHERE status='active'`,
   sql`SELECT employee_user_id,COALESCE(SUM(target_value),0)::numeric target_value,COUNT(*)::int target_count FROM ycm_employee_targets WHERE status='active' AND (${from} IS NULL OR period_end>=${from}::date) AND (${to} IS NULL OR period_start<=${to}::date) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COALESCE(SUM(amount) FILTER(WHERE status IN ('pending','approved','paid')),0)::numeric earned_commission,COALESCE(SUM(amount) FILTER(WHERE status='paid'),0)::numeric paid_commission,COUNT(*)::int commission_entries FROM ycm_employee_commission WHERE (${from} IS NULL OR earned_at>=${from}::timestamptz) AND (${to} IS NULL OR earned_at<(${to}::date+1)::timestamptz) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COUNT(*) FILTER(WHERE status='present')::int present_days,COUNT(*) FILTER(WHERE status='absent')::int absent_days,COUNT(*) FILTER(WHERE status='half_day')::int half_days,COUNT(*) FILTER(WHERE status='leave')::int leave_days,COALESCE(SUM(worked_seconds),0)::int worked_seconds FROM ycm_employee_attendance WHERE (${from} IS NULL OR attendance_date>=${from}::date) AND (${to} IS NULL OR attendance_date<=${to}::date) GROUP BY employee_user_id`
  ]);
  const map=new Map(people.map((p:any)=>[p.id,{...p}]));
  for(const [rows,key] of [[comp,'compensation'],[targets,'targets'],[comm,'commission'],[attendance,'attendance']] as const)for(const x of rows as any[]){const id=x.employee_user_id;const e=map.get(id);if(e)e[key]=x;}
  return NextResponse.json({success:true,employees:[...map.values()]});
 }catch(e){return NextResponse.json({success:false,code:'EMPLOYEE_COMPENSATION_QUERY_FAILED'},{status:500});}
}
