import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {buildAuditRecord} from '../../../../../lib/ycm-audit-events';
import {getPostgresYcmAuditStore} from '../../../../../lib/ycm-postgres-audit-store';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const roles=new Set(['ceo','management','admin']);
const states=new Set(['active','assigned','maintenance','disposed','lost']);
export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.has(s.role))return NextResponse.json({success:false,code:s?'FORBIDDEN':'AUTHENTICATION_REQUIRED'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as {assetId?:string;status?:string;assignedEmployeeUserId?:string|null;location?:string|null}|null;
 if(!b?.assetId||(!b.status&&!('assignedEmployeeUserId' in (b||{}))&&!('location' in (b||{}))))return NextResponse.json({success:false,code:'ASSET_CHANGE_FIELDS_REQUIRED'},{status:400});
 if(b.status&&!states.has(b.status))return NextResponse.json({success:false,code:'ASSET_STATUS_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const row=(await sql`UPDATE ycm_company_assets SET status=COALESCE(${b.status??null},status),assigned_employee_user_id=CASE WHEN ${'assignedEmployeeUserId' in (b||{})} THEN ${b.assignedEmployeeUserId??null} ELSE assigned_employee_user_id END,location=CASE WHEN ${'location' in (b||{})} THEN ${b.location??null} ELSE location END,updated_at=NOW() WHERE asset_id=${b.assetId} RETURNING asset_id,status,assigned_employee_user_id,location`)[0];if(!row)return NextResponse.json({success:false,code:'ASSET_NOT_FOUND'},{status:404});
 const audit=getPostgresYcmAuditStore();if(audit)await audit.append(buildAuditRecord({event:'COMPANY_ASSET_CONTROL_CHANGED',subject:s.sub,role:s.role,sessionId:s.sessionId,resourceType:'company_asset',resourceId:b.assetId,success:true})).catch(()=>{});
 return NextResponse.json({success:true,asset:row});}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'ASSET_CHANGE_FAILED'},{status:400});}finally{await sql.end({timeout:3});}}
