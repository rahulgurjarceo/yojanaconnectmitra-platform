import fs from 'node:fs';

const path='app/api/service-applications/route.ts';
const source=fs.readFileSync(path,'utf8');

if(!source.includes("['ceo', 'admin', 'management'].includes(session.role)")) {
  throw new Error('Service application authorization must restrict arbitrary family access to privileged roles');
}
if(source.includes("['ceo', 'admin', 'management', 'employee', 'partner', 'referral'].includes(session.role)")) {
  throw new Error('Service application route still grants arbitrary family access to employee/partner/referral sessions');
}
if(!source.includes('return session.familyId === familyId;')) {
  throw new Error('Service application route must bind non-privileged sessions to their family');
}

console.log('Service application IDOR authorization contract: PASS');
