import fs from 'node:fs';

const access=fs.readFileSync('app/lib/ycm-access-control.ts','utf8');
const issuance=fs.readFileSync('app/lib/ycm-auth-issuance.ts','utf8');

if(!access.includes("__Host-ycm_session")) throw new Error('missing host-only production cookie');
if(!access.includes("process.env.NODE_ENV === 'production' ? PRODUCTION_COOKIE : COOKIE")) throw new Error('production cookie selection missing');
if(!issuance.includes('httpOnly: true')) throw new Error('missing HttpOnly session cookie');
if(!issuance.includes('secure: process.env.NODE_ENV === \'production\'')) throw new Error('missing production Secure cookie');
if(!issuance.includes('sameSite: \'lax\'')) throw new Error('missing SameSite cookie policy');
if(!issuance.includes("path: '/'")) throw new Error('missing host cookie path');

console.log('AUTH SESSION COOKIE SECURITY CONTRACT: PASS');
