import fs from 'node:fs';
const access=fs.readFileSync('app/lib/ycm-access-control.ts','utf8');
const migration=fs.readFileSync('database/migrations/038_government_manager_scopes.sql','utf8');
const helper=fs.readFileSync('app/lib/ycm-government-rbac.ts','utf8');
for(const token of ['branch_manager','government:contacts:manage','government:grievance:manage']) if(!access.includes(token)) throw new Error('Missing RBAC contract: '+token);
for(const token of ['ycm_government_manager_scopes','geography_level','district','block','gram_panchayat','village']) if(!migration.includes(token)) throw new Error('Missing scope schema: '+token);
for(const token of ['canManageGovernmentContacts','isGlobalGovernmentExecutive','scopeMatches']) if(!helper.includes(token)) throw new Error('Missing geography RBAC helper: '+token);
console.log('GOVERNMENT_RBAC_CONTRACT_TEST: PASS');
