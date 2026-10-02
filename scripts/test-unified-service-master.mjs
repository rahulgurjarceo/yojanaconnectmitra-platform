import fs from 'node:fs';
const migration=fs.readFileSync('database/migrations/019_unified_service_master.sql','utf8');
const api=fs.readFileSync('app/api/service-master/route.ts','utf8');
for(const x of ['ycm_service_master','GOV_E_GOVERNMENT_ASSISTANCE','DOC_IDENTITY','DOC_OCR_VERIFICATION','TRAVEL_FLIGHT','TRAVEL_HOTEL','TRAVEL_PACKAGE']) if(!migration.includes(x)) throw new Error('missing '+x);
for(const x of ['ycm_service_master','service_type','business_domain_code']) if(!api.includes(x)) throw new Error('missing api '+x);
console.log('UNIFIED_SERVICE_MASTER_CONTRACT_TEST: PASS');
