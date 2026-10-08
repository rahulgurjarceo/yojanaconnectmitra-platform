import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const TERMS:Record<string,string[]>={
'loans-finance-insurance':['loan','लोन','ऋण','finance','फाइनेंस','insurance','बीमा','business loan'],
'education-admission-scholarship':['school','स्कूल','college','कॉलेज','education','पढ़ाई','scholarship','स्कॉलरशिप','admission'],
'agriculture-farmer':['farmer','किसान','खेती','agriculture','कृषि','फसल','subsidy','अनुदान','kcc'],
'government-services-schemes':['scheme','योजना','सरकारी','government','सरकार','benefit','लाभ','pension','पेंशन'],
'documents-certificates':['aadhaar','आधार','pan','पैन','voter','वोटर','certificate','प्रमाण','domicile','जाति'],
'jobs-employment-internship':['job','जॉब','नौकरी','employment','रोजगार','internship','इंटर्नशिप'],
'business-startup-msme':['business','बिजनेस','व्यवसाय','startup','स्टार्टअप','msme','udyam','उद्यम'],
'legal-documentation':['lawyer','वकील','legal','कानूनी','case','मुकदमा','agreement','एग्रीमेंट'],
'banking-financial-services':['bank','बैंक','atm','एटीएम','account','खाता','banking'],
'travel-passport-visa-immigration':['passport','पासपोर्ट','visa','वीजा','travel','यात्रा']
};
function norm(v:string){return v.toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu,' ').replace(/\s+/g,' ').trim()}
function domainFor(v:string){const n=norm(v);let best:string|null=null,score=0;for(const [d,terms] of Object.entries(TERMS)){const s=terms.reduce((x,t)=>x+(n.includes(norm(t))?1:0),0);if(s>score){score=s;best=d}}return best}
export async function POST(r:NextRequest){
 const b=await r.json().catch(()=>({}));const text=String(b.text||b.transcript||'').trim();
 if(!text)return NextResponse.json({success:false,code:'VOICE_TEXT_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const domain=domainFor(text);
 try{
  const rows=await sql`SELECT sm.service_code,sm.service_name,sm.service_type,sm.business_domain_code,sm.channel,sm.requires_documents,sm.requires_provider,
   COALESCE((SELECT jsonb_agg(jsonb_build_object('documentCode',d.document_code,'documentName',d.document_name,'required',d.required,'sourceName',d.source_name,'sourceUrl',d.source_url,'reuseIfValid',d.reuse_if_valid) ORDER BY d.document_name) FROM ycm_service_documents d WHERE d.service_code=sm.service_code),'[]'::jsonb) documents,
   COALESCE((SELECT jsonb_agg(jsonb_build_object('channel',p.channel,'customerPrice',p.customer_price,'currency',p.currency) ORDER BY p.effective_from DESC) FROM ycm_service_pricing p WHERE p.service_code=sm.service_code AND p.status='active'),'[]'::jsonb) pricing
   FROM ycm_service_master sm
   WHERE sm.status='active' AND (${domain}::text IS NULL OR sm.business_domain_code=${domain})
   ORDER BY CASE WHEN ${domain}::text IS NOT NULL AND sm.business_domain_code=${domain} THEN 0 ELSE 1 END,sm.service_name LIMIT 8`;
  return NextResponse.json({success:true,intent:{text,domain,confidence:domain?'domain_match':'needs_clarification'},services:rows,note:'Official eligibility and approval must be verified before application.'},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3})}
}
