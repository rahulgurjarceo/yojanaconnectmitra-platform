import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const TERMS:Record<string,string[]>={
'government-services-schemes':['scheme','योजना','सरकारी','government','सरकार','benefit','लाभ'],
'documents-certificates':['aadhaar','आधार','pan','पैन','voter','वोटर','certificate','प्रमाण','domicile','जाति','birth certificate','जन्म प्रमाण'],
'education-admission-scholarship':['school','स्कूल','college','कॉलेज','education','पढ़ाई','scholarship','स्कॉलरशिप','admission','दाखिला'],
'jobs-employment-internship':['job','जॉब','नौकरी','employment','रोजगार','internship','इंटर्नशिप','placement'],
'business-startup-msme':['business','बिजनेस','व्यवसाय','startup','स्टार्टअप','msme','udyam','उद्यम'],
'loans-finance-insurance':['loan','लोन','ऋण','finance','फाइनेंस','insurance','बीमा','business loan'],
'tax-gst-accounting':['tax','टैक्स','gst','जीएसटी','itr','इनकम टैक्स','accounting','अकाउंटिंग'],
'legal-documentation':['lawyer','वकील','legal','कानूनी','agreement','एग्रीमेंट','legal document'],
'property-land':['property','प्रॉपर्टी','land','जमीन','भूमि','registry','रजिस्ट्री','plot'],
'court-authority-process':['court','कोर्ट','अदालत','authority','प्राधिकरण','case','मुकदमा'],
'health-medical-discovery':['health','हेल्थ','स्वास्थ्य','hospital','हॉस्पिटल','clinic','क्लिनिक','doctor','डॉक्टर','इलाज','treatment','दवा','medicine','medical'],
'travel-passport-visa-immigration':['passport','पासपोर्ट','visa','वीजा','travel','यात्रा','immigration','इमिग्रेशन'],
'overseas-education-employment':['abroad','विदेश','overseas','foreign study','विदेश पढ़ाई','विदेश नौकरी'],
'women-children-senior':['women','महिला','बच्चा','बच्चों','child','senior citizen','वरिष्ठ नागरिक','महिला योजना'],
'disability-social-welfare':['disability','दिव्यांग','विकलांग','social welfare','सामाजिक कल्याण'],
'agriculture-farmer':['farmer','किसान','खेती','agriculture','कृषि','फसल','subsidy','अनुदान','kcc'],
'labour-worker':['labour','लेबर','worker','मजदूर','श्रमिक','labour card','श्रम कार्ड'],
'pension':['pension','पेंशन','वृद्धावस्था पेंशन','widow pension','विधवा पेंशन'],
'banking-financial-services':['bank','बैंक','atm','एटीएम','account','खाता','banking'],
'digital-services':['digital','डिजिटल','online form','ऑनलाइन फॉर्म','internet','ई-मित्र'],
'utility-services':['electricity','बिजली','water','पानी','gas','गैस','telecom','mobile recharge'],
'consumer-grievances':['consumer','उपभोक्ता','complaint','शिकायत','consumer complaint'],
'police-public-grievance':['police','पुलिस','fir','एफआईआर','public grievance','जन शिकायत'],
'municipal-local-body':['municipal','नगरपालिका','नगर निगम','panchayat','पंचायत','local body'],
'ngo-social-assistance':['ngo','एनजीओ','social help','सामाजिक सहायता','charity'],
'professional-services':['professional','प्रोफेशनल','ca','सीए','cs','सीएस','advocate','एडवोकेट','expert'],
'corporate-business-services':['corporate','कॉरपोरेट','company services','b2b','enterprise','कंपनी सेवा'],
'international-citizen-resident':['international','अंतरराष्ट्रीय','resident','प्रवासी','nri','एनआरआई'],
'transport-mobility':['driving licence','ड्राइविंग लाइसेंस','dl','vehicle','गाड़ी','rc','permit','परमिट','transport'],
'food-nutrition':['ration','राशन','food','खाद्य','nutrition','पोषण','pds'],
'skills-vocational-training':['skill','स्किल','कौशल','training','ट्रेनिंग','vocational','आईटीआई','iti'],
'housing-urban-development':['housing','आवास','घर','urban development','शहरी विकास','pmay'],
'environment-climate':['environment','पर्यावरण','climate','जलवायु','waste','कचरा','pollution','प्रदूषण'],
'public-safety-emergency':['emergency','आपातकाल','ambulance','एम्बुलेंस','fire','फायर','safety','सुरक्षा'],
'youth-sports-culture':['youth','युवा','sports','खेल','culture','संस्कृति','talent','प्रतिभा']
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
