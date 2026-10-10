import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const universe=fs.readFileSync(path.join(root,'app/case-universe.ts'),'utf8');
const voice=fs.readFileSync(path.join(root,'app/api/ai-mitra/voice/route.ts'),'utf8');
const journey=fs.readFileSync(path.join(root,'app/api/ycm-one/journey/route.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'database/migrations/059_universal_journey_context.sql'),'utf8');

const domains=[
'government-services-schemes','documents-certificates','education-admission-scholarship','jobs-employment-internship',
'business-startup-msme','loans-finance-insurance','tax-gst-accounting','legal-documentation','property-land',
'court-authority-process','health-medical-discovery','travel-passport-visa-immigration','overseas-education-employment',
'women-children-senior','disability-social-welfare','agriculture-farmer','labour-worker','pension','banking-financial-services',
'digital-services','utility-services','consumer-grievances','police-public-grievance','municipal-local-body',
'ngo-social-assistance','professional-services','corporate-business-services','international-citizen-resident','transport-mobility',
'food-nutrition','skills-vocational-training','housing-urban-development','environment-climate','public-safety-emergency',
'youth-sports-culture'
];

for(const d of domains){
 if(!universe.includes("'"+d+"'")) throw new Error("Missing canonical domain: "+d);
 if(!voice.includes("'"+d+"'")) throw new Error("Voice intent missing domain: "+d);
}
for(const s of [
 'ycm_family_cases','need_text','location_id','provider_id','referral_status','next_action',
 'ycm_service_providers','latitude','longitude','verified_at'
]) if(!migration.includes(s)) throw new Error("Migration missing: "+s);

for(const s of [
 'need_captured','location_resolved','service_discovered','eligibility_checked','documents_checked',
 'application_or_referral','case_tracking','follow_up','outcome'
]) if(!journey.includes("'"+s+"'")) throw new Error("Journey stage missing: "+s);

if(!journey.includes("SERVICE_DOMAIN_MISMATCH")) throw new Error("Domain/service alignment guard missing");

console.log("Universal journey contract: 35 domains + voice mapping + journey stages + geo/provider context verified.");
