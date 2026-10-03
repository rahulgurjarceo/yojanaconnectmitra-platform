import fs from 'node:fs';
const src=fs.readFileSync('app/lib/ycm-security.ts','utf8');
for(const n of ['createHash','hashSecurityIdentifier','assertSafePublicIdentifier','assertPositiveInteger']) if(!src.includes(n)) throw new Error('missing '+n);
console.log('Security primitives contract OK');
