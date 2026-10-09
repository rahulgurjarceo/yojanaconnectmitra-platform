import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const pkg=JSON.parse(await fs.readFile('package.json','utf8'));
assert.equal(pkg.dependencies?.next,'16.3.8','Expected audited Next.js baseline');
const lock=JSON.parse(await fs.readFile('package-lock.json','utf8'));
assert.equal(lock.packages?.['node_modules/next']?.version,'16.3.8','Lockfile Next.js mismatch');

const migrations=(await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql'));
const nums=migrations.map(x=>Number(x.split('_')[0])).filter(Number.isFinite);
assert.equal(nums.length,new Set(nums).size,'Duplicate migration number detected');

const docker=await fs.readFile('Dockerfile','utf8');
assert.match(docker,/\.next\/standalone/);
assert.match(docker,/CMD \["node","server\.js"\]/);
assert.match(docker,/node:24-alpine/);

const env=await fs.readFile('.env.example','utf8');
for(const name of ['DATABASE_URL','YCM_SESSION_SECRET','RAZORPAY_KEY_SECRET','PAYU_MERCHANT_SALT','PAYTM_MERCHANT_KEY']) assert.match(env,new RegExp('^'+name+'=', 'm'));

const application=await fs.readFile('app/api/service-applications/route.ts','utf8');
assert.match(application,/reuse_if_valid/);
assert.match(application,/prefilledData/);
assert.match(application,/MISSING_OR_EXPIRED/);

// Production readiness must verify live DB connectivity and fail closed.
const readiness=await fs.readFile('app/api/ready/route.ts','utf8');
assert.match(readiness,/await sql`SELECT 1 AS connected/);
assert.match(readiness,/to_regclass\('public\.ycm_revoked_sessions'\)/);
assert.match(readiness,/to_regclass\('public\.ycm_security_audit_events'\)/);
assert.match(readiness,/sessionSecret\.length >= 32/);
assert.match(readiness,/getCustomerFamilyOtpProvider\(\)/);
assert.match(readiness,/status: ready \? 200 : 503/);
assert.match(readiness,/Cache-Control.*no-store/);

console.log('RELEASE_AUDIT_CONTRACT: PASS');
