import fs from 'node:fs';
const route=fs.readFileSync('app/api/aeps/eko/callback/route.ts','utf8');
const migration=fs.readFileSync('database/migrations/035_eko_aeps_retailer_transactions.sql','utf8');
const required=[
 ['callback signature',/x-eko-callback-signature/],
 ['HMAC verification',/createHmac\('sha256'/],
 ['timing safe compare',/timingSafeEqual/],
 ['client reference lookup',/client_ref_id=\$1/],
 ['terminal idempotency guard',/terminal\.has\(tx\.status\)/],
 ['conditional terminal update',/status NOT IN \('success','failed','reversed'\)/],
 ['provider payload persistence',/provider_payload=/],
 ['unique client reference',/client_ref_id VARCHAR\(20\) NOT NULL UNIQUE/]
];
for(const [name,re] of required)if(!re.test(name==='unique client reference'?migration:route))throw new Error('AEPS callback replay contract missing: '+name);
console.log('AEPS_CALLBACK_REPLAY_CONTRACT_TEST: PASS');
