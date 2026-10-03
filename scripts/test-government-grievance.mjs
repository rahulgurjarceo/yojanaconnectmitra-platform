import fs from 'node:fs';
const migration=fs.readFileSync('database/migrations/037_government_contacts_grievance.sql','utf8');
const domain=fs.readFileSync('app/lib/ycm-government-grievance.ts','utf8');
const route=fs.readFileSync('app/api/government/route.ts','utf8');
for(const token of ['ycm_government_contacts','verification_status','source_url','anti_corruption','ycm_government_grievance_cases','bribery_report','ycm_government_grievance_events']) if(!migration.includes(token)) throw new Error('Missing schema: '+token);
for(const token of ['officialOnly','allegationDisclaimer','corruption_bribery','service_refusal']) if(!domain.includes(token)) throw new Error('Missing domain contract: '+token);
for(const token of ["verification_status='verified'","valid_until",'AUTHENTICATION_REQUIRED','ycm_government_grievance_cases','CASE_CREATED','GRIEVANCE_CATEGORY_INVALID','GRIEVANCE_ALLEGATION_TYPE_INVALID']) if(!route.includes(token)) throw new Error('Missing API contract: '+token);
console.log('GOVERNMENT_GRIEVANCE_CONTRACT_TEST: PASS');
