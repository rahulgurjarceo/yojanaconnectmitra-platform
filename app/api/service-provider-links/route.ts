import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const jsonObject=(v:unknown)=>v===undefined||v===null||(typeof v==='object'&&!Array.isArray(v));
const jsonSizeOk=(v:unknown)=>{try{return JSON.stringify(v??{}).length<=32768;}catch{return false;}};
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!['ceo','management','admin'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const b=await r.json(),serviceCode=String(b.serviceCode||'').trim().toUpperCase(),providerCode=String(b.providerCode||'').trim().toUpperCase();
 if(!serviceCode||!providerCode)return NextResponse.json({success:false,code:'SERVICE_AND_PROVIDER_REQUIRED'},{status:400});
 if(!Number.isInteger(b.priority)||b.priority<0||b.priority>100000)return NextResponse.json({success:false,code:'PROVIDER_LINK_PRIORITY_INVALID'},{status:400});
 if(b.commissionRate!==undefined&&(!Number.isFinite(Number(b.commissionRate))||Number(b.commissionRate)<0||Number(b.commissionRate)>100))return NextResponse.json({success:false,code:'PROVIDER_LINK_COMMISSION_INVALID'},{status:400});
 if(!jsonObject(b.metadata)||!jsonSizeOk(b.metadata))return NextResponse.json({success:false,code:'PROVIDER_LINK_METADATA_INVALID'},{status:400});
 const row=(await sql`INSERT INTO ycm_service_provider_links(service_code,provider_id,priority,enabled,commission_rate,metadata)
 SELECT ${serviceCode},provider_id,${b.priority},${b.enabled!==false},${b.commissionRate??null},${JSON.stringify(b.metadata||{})}::jsonb FROM ycm_service_providers WHERE provider_code=${providerCode}
 ON CONFLICT(service_code,provider_id) DO UPDATE SET priority=EXCLUDED.priority,enabled=EXCLUDED.enabled,commission_rate=EXCLUDED.commission_rate,metadata=EXCLUDED.metadata
 RETURNING link_id,service_code,provider_id,priority,enabled,commission_rate`)[0];
 if(!row)return NextResponse.json({success:false,code:'PROVIDER_NOT_FOUND'},{status:404});
 return NextResponse.json({success:true,link:row},{status:201});
 }catch(e){return NextResponse.json({success:false,code:'PROVIDER_LINK_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});}finally{await sql.end({timeout:3});}
}
