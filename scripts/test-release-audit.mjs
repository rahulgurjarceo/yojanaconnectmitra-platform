import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const pkg=JSON.parse(await fs.readFile('package.json','utf8'));
assert.equal(pkg.dependencies?.next,'16.3.8','Expected audited Next.js baseline');
assert.equal(pkg.devDependencies?.['eslint-config-next'],'16.3.8','Next ESLint baseline aligned');
const lock=JSON.parse(await fs.readFile('package-lock.json','utf8'));
assert.equal(lock.packages?.['node_modules/next']?.version,'16.3.8','Lockfile Next.js mismatch');
assert.equal(lock.packages?.['node_modules/eslint-config-next']?.version,'16.3.8','Lockfile eslint-config-next mismatch');

const migrations=(await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql'));
const nums=migrations.map(x=>Number(x.split('_')[0])).filter(Number.isFinite);
assert.equal(nums.length,new Set(nums).size,'Duplicate migration number detected');

const docker=await fs.readFile('Dockerfile','utf8');
assert.match(docker,/\.next\/standalone/);
assert.match(docker,/CMD \["node","server\.js"\]/);

const env=await fs.readFile('.env.example','utf8');
for(const name of ['DATABASE_URL','YCM_SESSION_SECRET','RAZORPAY_KEY_SECRET','PAYU_MERCHANT_SALT','PAYTM_MERCHANT_KEY']) assert.match(env,new RegExp('^'+name+'=', 'm'));

const application=await fs.readFile('app/api/service-applications/route.ts','utf8');
assert.match(application,/reuse_if_valid/);
assert.match(application,/prefilledData/);
assert.match(application,/MISSING_OR_EXPIRED/);

console.log('RELEASE_AUDIT_CONTRACT: PASS');
