import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const actor=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const manage=(role:string)=>['ceo','management','admin'].includes(role);
export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const code=new URL(r.url).searchParams.get('serviceCode');
 const rows=code?await sql`SELECT workflow_id,service_code,version,steps,status,metadata,created_at,updated_at FROM ycm_service_workflows WHERE service_code=${code} ORDER BY version DESC`:await sql`SELECT workflow_id,service_code,version,steps,status,metadata,created_at,updated_at FROM ycm_service_workflows ORDER BY service_code,version DESC`;
 return NextResponse.json({success:true,workflows:rows});}finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!manage(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const b=await r.json(),serviceCode=String(b.serviceCode||'').trim().toUpperCase(),steps=Array.isArray(b.steps)?b.steps:[];
 if(!serviceCode)return NextResponse.json({success:false,code:'SERVICE_CODE_REQUIRED'},{status:400});
 if(!['draft','active','inactive'].includes(String(b.status||'draft')))return NextResponse.json({success:false,code:'WORKFLOW_STATUS_INVALID'},{status:400});
 if(steps.length>100)return NextResponse.json({success:false,code:'WORKFLOW_STEPS_LIMIT_EXCEEDED'},{status:400});
 if(!steps.length)return NextResponse.json({success:false,code:'WORKFLOW_STEPS_REQUIRED'},{status:400});
 const max=(await sql`SELECT COALESCE(MAX(version),0)::int version FROM ycm_service_workflows WHERE service_code=${serviceCode}`)[0]?.version||0;
 const row=(await sql`INSERT INTO ycm_service_workflows(service_code,version,steps,status,metadata) VALUES(${serviceCode},${max+1},${JSON.stringify(steps)}::jsonb,${b.status||'draft'},${b.metadata||{}}) RETURNING *`)[0];
 return NextResponse.json({success:true,workflow:row},{status:201});}catch(e){return NextResponse.json({success:false,code:'WORKFLOW_CREATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});}finally{await sql.end({timeout:3});}
}
