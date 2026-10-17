import postgres from 'postgres';
import {createHash} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};

function hashDevice(value:string){return createHash('sha256').update(value).digest('hex');}

export async function GET(r:NextRequest){
 const session=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!session)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const providers=await sql.unsafe('SELECT provider_code,display_name,enabled,environment,cash_withdrawal,cash_deposit,balance_enquiry,mini_statement,fingerprint,face,iris,api_configured FROM ycm_aeps_provider_configs WHERE enabled=true ORDER BY provider_code');
  const routes=await sql.unsafe('SELECT provider_code,authentication_mode,transaction_type,enabled,priority FROM ycm_aeps_provider_routes WHERE enabled=true ORDER BY provider_code,transaction_type,priority');
  const user=(await sql.unsafe('SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1',[session.sub]))[0];
  const devices=user?await sql.unsafe('SELECT device_id,device_type,provider_code,rd_service_name,status,last_tested_at,created_at FROM ycm_aeps_devices WHERE user_id=$1 ORDER BY created_at DESC',[user.id]):[];
  return NextResponse.json({success:true,providers,routes,devices});
 }finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const session=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!session)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const body=await r.json().catch(()=>null) as {providerCode?:string;deviceType?:'mantra'|'morpho'|'startek'|'secugen'|'other';rdServiceName?:string;deviceIdentifier?:string}|null;
 if(!body?.providerCode||!body.deviceType||!body.deviceIdentifier)return NextResponse.json({success:false,code:'DEVICE_FIELDS_REQUIRED'},{status:400});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const user=(await sql.unsafe('SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1',[session.sub]))[0];
  if(!user)return NextResponse.json({success:false,code:'USER_NOT_FOUND'},{status:404});
  const provider=(await sql.unsafe('SELECT provider_code FROM ycm_aeps_provider_configs WHERE provider_code=$1 AND enabled=true LIMIT 1',[body.providerCode]))[0];
  if(!provider)return NextResponse.json({success:false,code:'AEPS_PROVIDER_NOT_ENABLED'},{status:409});
  const deviceHash=hashDevice(body.deviceIdentifier);
  const row=(await sql.unsafe(`INSERT INTO ycm_aeps_devices(user_id,device_type,provider_code,rd_service_name,device_identifier_hash,status)
    VALUES($1,$2,$3,$4,$5,'pending')
    ON CONFLICT(user_id,provider_code,device_identifier_hash) DO UPDATE SET device_type=EXCLUDED.device_type,rd_service_name=EXCLUDED.rd_service_name,status='pending'
    RETURNING device_id,device_type,provider_code,rd_service_name,status,created_at`,[user.id,body.deviceType,body.providerCode,body.rdServiceName||null,deviceHash]))[0];
  return NextResponse.json({success:true,device:row},{status:201});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'DEVICE_REGISTRATION_FAILED'},{status:400});}
 finally{await sql.end({timeout:3});}
}