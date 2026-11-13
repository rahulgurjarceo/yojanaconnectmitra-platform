import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const actor=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const fail=(code:string,status:number)=>NextResponse.json({success:false,code},{status});
const executive=['ceo','admin','management'];
const managers=['ceo','admin','management','state_manager','district_manager','block_manager','branch_manager','team_lead'];
export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return fail('AUTHENTICATION_REQUIRED',401);if(!managers.includes(s.role)&&s.role!=='employee')return fail('FORBIDDEN',403);
 const sql=db();if(!sql)return fail('DATABASE_NOT_CONFIGURED',503);
 try{
  const managesTeam=s.role==='employee' && Boolean((await sql`SELECT 1 FROM ycm_crm_team_members WHERE manager_user_id=${s.sub} AND active=true LIMIT 1`)[0]);
  const own=s.role==='employee'&&!managesTeam;
  const members=own
   ?await sql`SELECT u.user_id,u.full_name AS name,u.role,u.status,t.member_type,t.state_code,t.district_code,t.block_code,t.village_code,t.monthly_target_paise FROM ycm_users u LEFT JOIN ycm_crm_team_members t ON t.member_user_id=u.user_id WHERE u.user_id=${s.sub} LIMIT 1`
   :executive.includes(s.role)
    ?await sql`SELECT u.user_id,u.name,u.role,u.status,t.manager_user_id,t.member_type,t.state_code,t.district_code,t.block_code,t.village_code,t.monthly_target_paise FROM ycm_users u LEFT JOIN ycm_crm_team_members t ON t.member_user_id=u.user_id ORDER BY u.full_name LIMIT 500`
    :await sql`SELECT u.user_id,u.name,u.role,u.status,t.manager_user_id,t.member_type,t.state_code,t.district_code,t.block_code,t.village_code,t.monthly_target_paise FROM ycm_crm_team_members t JOIN ycm_users u ON u.user_id=t.member_user_id WHERE t.manager_user_id=${s.sub} AND t.active=true ORDER BY u.full_name LIMIT 500`;
  const ids=own?[s.sub]:members.map((m:any)=>m.user_id);
  const metrics=ids.length?await sql`SELECT user_id,COALESCE(SUM(leads_created),0)::int leads,COALESCE(SUM(calls_made),0)::int calls,COALESCE(SUM(sales_count),0)::int sales,COALESCE(SUM(sales_amount_paise),0)::bigint sales_amount_paise,COALESCE(SUM(followups_due),0)::int followups FROM ycm_crm_agent_daily_metrics WHERE user_id=ANY(${ids}) AND metric_date>=date_trunc('month',CURRENT_DATE)::date GROUP BY user_id`:[];
  return NextResponse.json({success:true,scope:own?'self':executive.includes(s.role)?'company':'direct_team',members,metrics});
 }catch{return fail('WORKFORCE_READ_FAILED',500)}finally{await sql.end({timeout:3})}
}
export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return fail('AUTHENTICATION_REQUIRED',401);if(!executive.includes(s.role)&&!['state_manager','district_manager','block_manager','branch_manager','team_lead','employee'].includes(s.role))return fail('FORBIDDEN',403);
 const b=await r.json().catch(()=>null);if(!b||typeof b.memberUserId!=='string'||!b.memberUserId.trim()||!['agent','team_lead','sales_manager','block_manager','district_manager','state_manager'].includes(b.memberType||'agent'))return fail('INVALID_TEAM_MEMBER',400);
 const sql=db();if(!sql)return fail('DATABASE_NOT_CONFIGURED',503);
 try{
  const target=(await sql`SELECT user_id,role FROM ycm_users WHERE user_id=${b.memberUserId} LIMIT 1`)[0];if(!target)return fail('USER_NOT_FOUND',404);
  if(!executive.includes(s.role)){const allowed=(await sql`SELECT 1 FROM ycm_crm_team_members WHERE manager_user_id=${s.sub} AND member_user_id=${b.memberUserId} LIMIT 1`)[0];if(!allowed&&s.role!=='team_lead')return fail('TEAM_SCOPE_DENIED',403);}
  const row=(await sql`INSERT INTO ycm_crm_team_members(manager_user_id,member_user_id,member_type,state_code,district_code,block_code,village_code,monthly_target_paise) VALUES(${s.sub},${b.memberUserId},${b.memberType||'agent'},${b.stateCode||null},${b.districtCode||null},${b.blockCode||null},${b.villageCode||null},${Math.max(0,Math.trunc(Number(b.monthlyTargetPaise)||0))}) ON CONFLICT(manager_user_id,member_user_id) DO UPDATE SET member_type=EXCLUDED.member_type,state_code=EXCLUDED.state_code,district_code=EXCLUDED.district_code,block_code=EXCLUDED.block_code,village_code=EXCLUDED.village_code,monthly_target_paise=EXCLUDED.monthly_target_paise,active=true RETURNING id,manager_user_id,member_user_id,member_type,monthly_target_paise`)[0];
  return NextResponse.json({success:true,membership:row},{status:201});
 }catch{return fail('TEAM_ASSIGNMENT_FAILED',500)}finally{await sql.end({timeout:3})}
}
