import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../lib/ycm-access-control';
import {canTransitionServiceStatus,hasServicePermission,YcmServiceStatus} from '../../lib/ycm-service-governance';

export const runtime='nodejs';

const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};

function actor(r:NextRequest){return verifySession(r.cookies.get(sessionCookieName())?.value);}
function canManage(role:string){return ['ceo','management','admin'].includes(role);}

export async function GET(r:NextRequest){
 const s=actor(r); if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const u=new URL(r.url),type=u.searchParams.get('type'),domain=u.searchParams.get('domain'),vertical=u.searchParams.get('vertical'),q=u.searchParams.get('q'),includeAll=u.searchParams.get('includeAll')==='true'&&canManage(s.role);
  const stateCode=u.searchParams.get('stateCode'),districtCode=u.searchParams.get('districtCode'),blockCode=u.searchParams.get('blockCode'),gramPanchayatCode=u.searchParams.get('gramPanchayatCode'),villageCode=u.searchParams.get('villageCode');
  if(districtCode&&!stateCode)return NextResponse.json({success:false,code:'GEOGRAPHY_STATE_REQUIRED'},{status:400});
  if(blockCode&&(!stateCode||!districtCode))return NextResponse.json({success:false,code:'GEOGRAPHY_DISTRICT_REQUIRED'},{status:400});
  if(gramPanchayatCode&&(!stateCode||!districtCode||!blockCode))return NextResponse.json({success:false,code:'GEOGRAPHY_BLOCK_REQUIRED'},{status:400});
  if(villageCode&&(!stateCode||!districtCode||!blockCode))return NextResponse.json({success:false,code:'GEOGRAPHY_BLOCK_REQUIRED_FOR_VILLAGE'},{status:400});
  const hasGeo=Boolean(stateCode||districtCode||blockCode||gramPanchayatCode||villageCode);
  const rows=await sql`
   SELECT sm.service_id,sm.service_code,sm.service_name,sm.service_type,sm.business_domain_code,
          sm.parent_service_code,sm.channel,sm.requires_case,sm.requires_documents,sm.requires_provider,
          sm.status,sm.metadata,sm.validity_days,sm.expiry_warning_days,sm.renewal_allowed,sm.renewal_window_days,sm.prefill_fields,
          COALESCE(jsonb_agg(DISTINCT jsonb_build_object('vertical_code',sv.vertical_code,'is_primary',sv.is_primary))
            FILTER (WHERE sv.vertical_code IS NOT NULL),'[]'::jsonb) AS verticals
   FROM ycm_service_master sm
   LEFT JOIN ycm_service_verticals sv ON sv.service_code=sm.service_code AND sv.status='active'
   WHERE (${includeAll} OR sm.status='active')
     AND (${type} IS NULL OR sm.service_type=${type})
     AND (${domain} IS NULL OR sm.business_domain_code=${domain})
     AND (${vertical} IS NULL OR EXISTS (
       SELECT 1 FROM ycm_service_verticals vx
       WHERE vx.service_code=sm.service_code AND vx.vertical_code=${vertical} AND vx.status='active'
     ))
     AND (${q} IS NULL OR sm.service_name ILIKE '%'||${q}||'%' OR sm.service_code ILIKE '%'||${q}||'%')
     AND (
       (${hasGeo}=false AND NOT EXISTS (
         SELECT 1 FROM ycm_service_geography_scope sg0
         WHERE sg0.service_code=sm.service_code AND sg0.enabled=true
       ))
       OR
       (${hasGeo}=true AND (
         NOT EXISTS (
           SELECT 1 FROM ycm_service_geography_scope sg0
           WHERE sg0.service_code=sm.service_code AND sg0.enabled=true
         )
         OR EXISTS (
           SELECT 1 FROM ycm_service_geography_scope sg
           WHERE sg.service_code=sm.service_code AND sg.enabled=true
             AND (
               (sg.geography_level='state' AND sg.state_code=${stateCode})
               OR (sg.geography_level='district' AND sg.state_code=${stateCode} AND sg.district_code=${districtCode})
               OR (sg.geography_level='block' AND sg.state_code=${stateCode} AND sg.district_code=${districtCode} AND sg.block_code=${blockCode})
               OR (sg.geography_level='gram_panchayat' AND sg.state_code=${stateCode} AND sg.district_code=${districtCode} AND sg.block_code=${blockCode} AND sg.gram_panchayat_code=${gramPanchayatCode})
               OR (sg.geography_level='village' AND sg.state_code=${stateCode} AND sg.district_code=${districtCode} AND sg.block_code=${blockCode} AND sg.village_code=${villageCode})
             )
         )
       ))
     )
   GROUP BY sm.service_id
   ORDER BY sm.service_name
  `;
  const serviceCode=u.searchParams.get('serviceCode');
  if(serviceCode){
   const details=(await sql`SELECT service_code,service_name,validity_days,expiry_warning_days,renewal_allowed,renewal_window_days,prefill_fields
     FROM ycm_service_master WHERE service_code=${serviceCode} LIMIT 1`)[0];
   if(!details)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:404});
   const documents=await sql`SELECT document_code,document_name,required,required_for_application,validation_mode,validity_days,expiry_warning_days,reuse_if_valid,reupload_on_expiry,prefill_fields,source_name,source_url,valid_from,valid_until,metadata
     FROM ycm_service_documents WHERE service_code=${serviceCode} ORDER BY document_name`;
   const workflow=(await sql`SELECT version,steps,status,metadata FROM ycm_service_workflows WHERE service_code=${serviceCode} AND status='active' ORDER BY version DESC LIMIT 1`)[0]||null;
   const pricing=await sql`SELECT channel,customer_price,provider_cost,commission_rate,currency,effective_from FROM ycm_service_pricing WHERE service_code=${serviceCode} AND status='active' ORDER BY effective_from DESC`;
   return NextResponse.json({success:true,service:details,documents,workflow,pricing},{headers:{'Cache-Control':'private,no-store'}});
  }
  return NextResponse.json({success:true,services:rows},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const s=actor(r); if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!canManage(s.role)||!hasServicePermission(s.role,'service:create'))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json();
  const code=String(b.serviceCode||'').trim().toUpperCase(),name=String(b.serviceName||'').trim(),type=String(b.serviceType||'other').trim();
  if(!code||!name)return NextResponse.json({success:false,code:'SERVICE_CODE_AND_NAME_REQUIRED'},{status:400});
  const validityDays=b.validityDays==null||b.validityDays===''?null:Number(b.validityDays);
  const expiryWarningDays=b.expiryWarningDays==null?30:Number(b.expiryWarningDays);
  const renewalWindowDays=b.renewalWindowDays==null?60:Number(b.renewalWindowDays);
  if((validityDays!==null&&(!Number.isInteger(validityDays)||validityDays<0))||expiryWarningDays<0||renewalWindowDays<0)return NextResponse.json({success:false,code:'SERVICE_LIFECYCLE_INVALID'},{status:400});
  const prefillFields=Array.isArray(b.prefillFields)?b.prefillFields:[];
  const documents=Array.isArray(b.documentRequirements)?b.documentRequirements:[];
  const rows=await sql`INSERT INTO ycm_service_master
   (service_code,service_name,service_type,business_domain_code,parent_service_code,channel,requires_case,requires_documents,requires_provider,status,metadata,validity_days,expiry_warning_days,renewal_allowed,renewal_window_days,prefill_fields)
   VALUES (${code},${name},${type},${b.businessDomainCode||null},${b.parentServiceCode||null},${b.channel||'assisted'},
           ${b.requiresCase!==false},${b.requiresDocuments===true||documents.length>0},${b.requiresProvider===true},'draft',${b.metadata||{}},${validityDays},${expiryWarningDays},${b.renewalAllowed!==false},${renewalWindowDays},${JSON.stringify(prefillFields)}::jsonb)
   RETURNING service_id,service_code,service_name,service_type,business_domain_code,parent_service_code,channel,requires_case,requires_documents,requires_provider,status,metadata,validity_days,expiry_warning_days,renewal_allowed,renewal_window_days,prefill_fields`;
  for(const d of documents){
   if(!d?.documentCode||!d?.documentName)continue;
   await sql`INSERT INTO ycm_service_documents(service_code,document_code,document_name,required,required_for_application,validation_mode,validity_days,expiry_warning_days,reuse_if_valid,reupload_on_expiry,prefill_fields,source_name,source_url,valid_from,valid_until,metadata)
    VALUES(${code},${String(d.documentCode).trim().toUpperCase()},${String(d.documentName).trim()},${d.required!==false},${d.requiredForApplication!==false},${d.validationMode||'manual'},${d.validityDays==null||d.validityDays===''?null:Number(d.validityDays)},${d.expiryWarningDays==null?30:Number(d.expiryWarningDays)},${d.reuseIfValid!==false},${d.reuploadOnExpiry!==false},${JSON.stringify(Array.isArray(d.prefillFields)?d.prefillFields:[])}::jsonb,${d.sourceName||null},${d.sourceUrl||null},${d.validFrom||null},${d.validUntil||null},${d.metadata||{}}::jsonb)`;
  }
  return NextResponse.json({success:true,service:rows[0]},{status:201});
 }catch(e){
  return NextResponse.json({success:false,code:'SERVICE_CREATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});
 }finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=actor(r); if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!canManage(s.role)||!hasServicePermission(s.role,'service:edit'))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const b=await r.json(),code=String(b.serviceCode||'').trim().toUpperCase();
  if(!code)return NextResponse.json({success:false,code:'SERVICE_CODE_REQUIRED'},{status:400});
  const validityDays=b.validityDays==null||b.validityDays===''?null:Number(b.validityDays);
  const expiryWarningDays=b.expiryWarningDays==null?30:Number(b.expiryWarningDays);
  const renewalWindowDays=b.renewalWindowDays==null?60:Number(b.renewalWindowDays);
  if((validityDays!==null&&(!Number.isInteger(validityDays)||validityDays<0))||expiryWarningDays<0||renewalWindowDays<0)return NextResponse.json({success:false,code:'SERVICE_LIFECYCLE_INVALID'},{status:400});
  if(b.status!==undefined){
   const next=String(b.status) as YcmServiceStatus;
   const current=(await sql`SELECT status FROM ycm_service_master WHERE service_code=${code} LIMIT 1`)[0];
   if(!current)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:404});
   if(!canTransitionServiceStatus(s.role,String(current.status) as YcmServiceStatus,next))return NextResponse.json({success:false,code:'SERVICE_STATUS_TRANSITION_FORBIDDEN'},{status:403});
  }
  const rows=await sql`UPDATE ycm_service_master SET
    service_name=COALESCE(${b.serviceName??null},service_name),
    service_type=COALESCE(${b.serviceType??null},service_type),
    business_domain_code=COALESCE(${b.businessDomainCode??null},business_domain_code),
    parent_service_code=COALESCE(${b.parentServiceCode??null},parent_service_code),
    channel=COALESCE(${b.channel??null},channel),
    requires_case=COALESCE(${b.requiresCase??null},requires_case),
    requires_documents=COALESCE(${b.requiresDocuments??null},requires_documents),
    requires_provider=COALESCE(${b.requiresProvider??null},requires_provider),
    status=COALESCE(${b.status??null},status),
    metadata=COALESCE(${b.metadata??null},metadata),
    validity_days=${validityDays},
    expiry_warning_days=COALESCE(${b.expiryWarningDays??null},expiry_warning_days),
    renewal_allowed=COALESCE(${b.renewalAllowed??null},renewal_allowed),
    renewal_window_days=COALESCE(${b.renewalWindowDays??null},renewal_window_days),
    prefill_fields=COALESCE(${b.prefillFields?JSON.stringify(b.prefillFields):null}::jsonb,prefill_fields),
    updated_at=now()
    WHERE service_code=${code}
    RETURNING service_id,service_code,service_name,service_type,business_domain_code,parent_service_code,channel,requires_case,requires_documents,requires_provider,status,metadata,validity_days,expiry_warning_days,renewal_allowed,renewal_window_days,prefill_fields`;
  if(!rows.length)return NextResponse.json({success:false,code:'SERVICE_NOT_FOUND'},{status:404});
  if(Array.isArray(b.documentRequirements)){
   await sql`DELETE FROM ycm_service_documents WHERE service_code=${code}`;
   for(const d of b.documentRequirements){
    if(!d?.documentCode||!d?.documentName)continue;
    await sql`INSERT INTO ycm_service_documents(service_code,document_code,document_name,required,required_for_application,validation_mode,validity_days,expiry_warning_days,reuse_if_valid,reupload_on_expiry,prefill_fields,source_name,source_url,valid_from,valid_until,metadata)
      VALUES(${code},${String(d.documentCode).trim().toUpperCase()},${String(d.documentName).trim()},${d.required!==false},${d.requiredForApplication!==false},${d.validationMode||'manual'},${d.validityDays==null||d.validityDays===''?null:Number(d.validityDays)},${d.expiryWarningDays==null?30:Number(d.expiryWarningDays)},${d.reuseIfValid!==false},${d.reuploadOnExpiry!==false},${JSON.stringify(Array.isArray(d.prefillFields)?d.prefillFields:[])}::jsonb,${d.sourceName||null},${d.sourceUrl||null},${d.validFrom||null},${d.validUntil||null},${d.metadata||{}}::jsonb)`;
   }
  }
  return NextResponse.json({success:true,service:rows[0]});
 }catch(e){
  return NextResponse.json({success:false,code:'SERVICE_UPDATE_FAILED',message:e instanceof Error?e.message:'unknown_error'},{status:400});
 }finally{await sql.end({timeout:3});}
}
