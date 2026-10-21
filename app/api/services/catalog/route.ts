import { NextResponse } from 'next/server';
import postgres from 'postgres';
export const runtime='nodejs';

export async function GET(){
 const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!u)return NextResponse.json({success:true,services:[]},{headers:{'Cache-Control':'public,max-age=60'}});
 const sql=postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20});
 try{
  const services=await sql`SELECT sm.service_code,sm.service_name,sm.service_type,sm.business_domain_code,sm.channel,sm.requires_case,sm.requires_documents,sm.requires_provider,sm.status,sm.validity_days,sm.expiry_warning_days,sm.renewal_allowed,sm.renewal_window_days,sm.prefill_fields,sm.metadata,
   pricing.customer_price,pricing.metadata AS pricing_metadata
   FROM ycm_service_master sm
   LEFT JOIN LATERAL (
     SELECT p.customer_price,p.metadata FROM ycm_service_pricing p
     WHERE p.service_code=sm.service_code AND p.status='active'
     ORDER BY p.effective_from DESC LIMIT 1
   ) pricing ON TRUE
   WHERE sm.status IN ('active','published') ORDER BY sm.service_name`;
  return NextResponse.json({success:true,services},{headers:{'Cache-Control':'public,max-age=60'}});
 }catch{ return NextResponse.json({success:false,code:'SERVICE_CATALOG_UNAVAILABLE'},{status:503}); }
 finally{await sql.end({timeout:2});}
}
