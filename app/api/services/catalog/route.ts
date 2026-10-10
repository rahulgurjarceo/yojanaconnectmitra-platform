import { NextResponse } from 'next/server';
import postgres from 'postgres';
export const runtime='nodejs';

export async function GET(){
 const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!u)return NextResponse.json({success:true,services:[]},{headers:{'Cache-Control':'public,max-age=60'}});
 const sql=postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20});
 try{
  const services=await sql`SELECT service_code,service_name,service_type,business_domain_code,channel,requires_case,requires_documents,requires_provider,status,validity_days,expiry_warning_days,renewal_allowed,renewal_window_days,prefill_fields
   FROM ycm_service_master WHERE status='active' ORDER BY service_name`;
  return NextResponse.json({success:true,services},{headers:{'Cache-Control':'public,max-age=60'}});
 }catch{ return NextResponse.json({success:false,code:'SERVICE_CATALOG_UNAVAILABLE'},{status:503}); }
 finally{await sql.end({timeout:2});}
}
