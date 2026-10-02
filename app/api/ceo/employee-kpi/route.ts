/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!['ceo','admin','management'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const u=new URL(r.url),employee=u.searchParams.get('employeeId'),from=u.searchParams.get('from'),to=u.searchParams.get('to');
 try{
  const [people,presence,calls,messages,leaves,kpis,activity]=await Promise.all([
   sql`SELECT id,user_id,full_name,email,mobile,status,role FROM ycm_users WHERE role='employee' AND status<>'disabled' AND (${employee} IS NULL OR id=${employee}::uuid) ORDER BY full_name`,
   sql`SELECT employee_user_id,COUNT(*)::int sessions,COALESCE(SUM(EXTRACT(EPOCH FROM COALESCE(logout_at,NOW())-login_at)),0)::int login_seconds,MAX(login_at) last_login FROM ycm_employee_presence WHERE (${from} IS NULL OR login_at>=${from}::timestamptz) AND (${to} IS NULL OR login_at<(${to}::date+1)::timestamptz) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COUNT(*) FILTER(WHERE direction='inbound' AND status='answered')::int calls_answered,COUNT(*) FILTER(WHERE direction='outbound')::int calls_outbound,COUNT(*) FILTER(WHERE status='disconnected')::int calls_disconnected,COUNT(*) FILTER(WHERE status='missed')::int calls_missed,COALESCE(SUM(duration_seconds),0)::int call_seconds FROM ycm_employee_calls WHERE (${from} IS NULL OR started_at>=${from}::timestamptz) AND (${to} IS NULL OR started_at<(${to}::date+1)::timestamptz) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COUNT(*) FILTER(WHERE direction='outbound')::int messages_sent,COUNT(*) FILTER(WHERE direction='inbound')::int messages_received,COUNT(*) FILTER(WHERE status='failed')::int messages_failed FROM ycm_employee_messages WHERE (${from} IS NULL OR sent_at>=${from}::timestamptz) AND (${to} IS NULL OR sent_at<(${to}::date+1)::timestamptz) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COUNT(*) FILTER(WHERE status='approved')::int approved_leaves,COUNT(*) FILTER(WHERE status='pending')::int pending_leaves FROM ycm_employee_leave WHERE (${from} IS NULL OR end_date>=${from}::date) AND (${to} IS NULL OR start_date<=${to}::date) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COALESCE(SUM(tasks_assigned),0)::int tasks_assigned,COALESCE(SUM(tasks_completed),0)::int tasks_completed,COALESCE(SUM(applications_processed),0)::int applications_processed,COALESCE(SUM(customers_served),0)::int customers_served FROM ycm_employee_daily_kpi WHERE (${from} IS NULL OR metric_date>=${from}::date) AND (${to} IS NULL OR metric_date<=${to}::date) GROUP BY employee_user_id`,
   sql`SELECT employee_user_id,COUNT(*)::int activity_count FROM ycm_employee_activity WHERE (${from} IS NULL OR occurred_at>=${from}::timestamptz) AND (${to} IS NULL OR occurred_at<(${to}::date+1)::timestamptz) GROUP BY employee_user_id`
  ]);
  const map=new Map(people.map((p:any)=>[p.id,{...p}]));
  for(const [rows,key] of [[presence,'presence'],[calls,'calls'],[messages,'messages'],[leaves,'leaves'],[kpis,'kpi'],[activity,'activity']] as const)for(const x of rows as any[]){const e=map.get(x.employee_user_id);if(e)e[key]=x;}
  return NextResponse.json({success:true,employees:[...map.values()]});
 }catch(e){return NextResponse.json({success:false,code:'EMPLOYEE_KPI_QUERY_FAILED'},{status:500});}
}