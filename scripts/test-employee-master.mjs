import fs from 'node:fs';
const required=['database/migrations/055_employee_master_performance_followups_projects.sql','app/api/employee/master/route.ts','app/api/employee/followups/route.ts'];
for(const p of required)if(!fs.existsSync(p))throw new Error('missing '+p);
const m=fs.readFileSync(required[0],'utf8');
for(const x of ['ycm_employee_followups','ycm_employee_projects','ycm_employee_performance_monthly','ycm_employee_performance_weights','ycm_employee_promotions'])if(!m.includes(x))throw new Error('missing schema '+x);
const api=fs.readFileSync(required[1],'utf8');if(!api.includes('months')||!api.includes('promotion_readiness'))throw new Error('master API incomplete');
const f=fs.readFileSync(required[2],'utf8');if(!f.includes('next_follow_up_at')||!f.includes('follow_up'))throw new Error('followup API incomplete');
console.log('employee master contract: PASS');