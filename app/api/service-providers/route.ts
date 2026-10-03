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
 const rows=code?await sql`SELECT p.provider_id,p.provider_code,p.provider_name,p.provider_type,p.capabilities,p.status,sp.priority,sp.enabled,sp.commission_rate FROM ycm_service_providers p JOIN ycm_service_provider_links sp ON sp.provider_id=p.provider_id WHERE sp.service_code=${code} ORDER BY sp.priority,p.provider_name`:await sql`SELECT provider_id,provider_code,provider_name,provider_type,capabilities,status FROM ycm_service_providers ORDER BY provider_name`;
 return NextResponse.json({success:true,providers:rows});}finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!manage(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const b=await r.json();const code=String(b.providerCode||'').trim().toUpperCase(),name=String(b.providerName||'').trim(),status=String(b.status||'sandbox');
 if(!code||!name)return NextResponse.json({success:false,code:'PROVIDER_CODE_AND_NAME_REQUIRED'},{status:400});
 if(!['active','inactive','sandbox'].includes(status))return NextResponse.json({success:false,code:'PROVIDER_STATUS_INVALID'},{status:400});
 const row=(await sql`INSERT INTO ycm_service_providers(provider_code,provider_name,provider_type,capabilities,status,metadata) VALUES(${code},${name},${b.providerType||'other'},${b.capabilities||{}},${status},${b.metadata||{}}) RETURNING *`)[0];
 return NextResponse.json({success:true,provider:row},{status:201});}catch(e){return NextResponse.json({success:false,code:'PROVIDER_CREATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});}finally{await sql.end({timeout:3});}
}
