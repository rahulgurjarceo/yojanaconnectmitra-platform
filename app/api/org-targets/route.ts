import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const sess=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
export async function GET(r:NextRequest){
 const s=sess(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const u=new URL(r.url),status=u.searchParams.get('status')||'active',employeeId=u.searchParams.get('employeeId'),teamId=u.searchParams.get('teamId');
  const rows=await sql`SELECT t.*,u.user_id owner_user_ref,tu.name team_name FROM ycm_org_targets t LEFT JOIN ycm_users u ON u.id=t.owner_user_id LEFT JOIN ycm_teams tu ON tu.team_id=t.team_id WHERE t.status=${status} AND (${employeeId} IS NULL OR u.user_id=${employeeId}) AND (${teamId} IS NULL OR t.team_id=${teamId}) ORDER BY t.period_start DESC,t.created_at DESC LIMIT 500`;
  return NextResponse.json({success:true,targets:rows},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=sess(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!['ceo','admin','management','team_lead'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
 const b=await r.json().catch(()=>null) as {targetType?:'company'|'state'|'district'|'block'|'franchise'|'team'|'employee';ownerUserId?:string;teamId?:string;parentTargetId?:string;stateCode?:string;districtCode?:string;blockCode?:string;franchiseEntityId?:string;teamType?:string;businessDomainCode?:string;metricCode?:string;targetValue?:number;unit?:string;periodStart?:string;periodEnd?:string;notes?:string}|null;
 if(!b?.targetType||!b.metricCode||b.targetValue==null||!b.periodStart||!b.periodEnd)return NextResponse.json({success:false,code:'TARGET_FIELDS_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const actor=(await sql`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0]?.id;if(!actor)return NextResponse.json({success:false,code:'ACTOR_NOT_FOUND'},{status:403});
  if(s.role==='team_lead'&&b.targetType!=='employee')return NextResponse.json({success:false,code:'TEAM_LEAD_CAN_ONLY_SET_EMPLOYEE_TARGETS'},{status:403});
  if(s.role==='team_lead'&&!b.teamId)return NextResponse.json({success:false,code:'TEAM_ID_REQUIRED'},{status:400});
  if(s.role==='team_lead'){
   const teamId=String(b.teamId||'');
   const team=(await sql`SELECT 1 FROM ycm_teams WHERE team_id=${teamId} AND manager_user_id=${actor} AND status='active' LIMIT 1`)[0];
   if(!team)return NextResponse.json({success:false,code:'TEAM_SCOPE_DENIED'},{status:403});
   const ownerUserId=String(b.ownerUserId||'');
   const member=(await sql`SELECT 1 FROM ycm_users WHERE user_id=${ownerUserId} AND team_id=${teamId} AND role='employee' AND status='active' LIMIT 1`)[0];
   if(!member)return NextResponse.json({success:false,code:'EMPLOYEE_OUTSIDE_TEAM'},{status:403});
  }
  let ownerId=null;if(b.ownerUserId)ownerId=(await sql`SELECT id FROM ycm_users WHERE user_id=${b.ownerUserId} LIMIT 1`)[0]?.id||null;
  if(b.targetType==='employee'&&!ownerId)return NextResponse.json({success:false,code:'OWNER_NOT_FOUND'},{status:400});
  const row=(await sql`INSERT INTO ycm_org_targets(target_type,owner_user_id,team_id,parent_target_id,state_code,district_code,block_code,franchise_entity_id,team_type,business_domain_code,metric_code,target_value,unit,period_start,period_end,assigned_by,notes) VALUES(${b.targetType},${ownerId},${b.teamId||null},${b.parentTargetId||null},${b.stateCode||null},${b.districtCode||null},${b.blockCode||null},${b.franchiseEntityId||null},${b.teamType||null},${b.businessDomainCode||null},${b.metricCode},${b.targetValue},${b.unit||'count'},${b.periodStart},${b.periodEnd},${actor},${b.notes||null}) RETURNING *`)[0];
  return NextResponse.json({success:true,target:row},{status:201});
 }finally{await sql.end({timeout:3});}
}