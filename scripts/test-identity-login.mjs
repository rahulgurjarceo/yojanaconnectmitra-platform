import fs from 'node:fs';
const migration=fs.readFileSync('database/migrations/040_verified_login_identifiers.sql','utf8');
const auth=fs.readFileSync('app/lib/ycm-auth-db.ts','utf8');
const route=fs.readFileSync('app/api/auth/identity/route.ts','utf8');
const service=fs.readFileSync('database/migrations/041_ration_passport_service_master.sql','utf8');
const login=fs.readFileSync('app/api/auth/login/route.ts','utf8');
for(const [name,src,needles] of [
 ['migration',migration,['ycm_login_identifiers','ration_card','passport','identifier_hash','verification_status']],
 ['auth db',auth,['YCM_LOGIN_IDENTIFIER_TYPES','hashLoginIdentifier','findUser','linkVerifiedLoginIdentifier','YCM_IDENTITY_HASH_SECRET',"verification_status='verified'"]],
 ['identity route',route,["['ceo', 'admin']",'ALLOWED_VERIFICATION_SOURCES','manualVerificationConfirmed !== true','VERIFICATION_SOURCE_NOT_ALLOWED','IDENTITY_VERIFICATION_CONFIRMATION_REQUIRED','Cache-Control']],
 ['service master',service,['DOC_RATION_CARD','AUTH_RATION_CARD_LOGIN','AUTH_PASSPORT_LOGIN','TRAVEL_PASSPORT']],
 ['login',login,['findUser(identifier','loginRateLimited']]
]) for(const n of needles) if(!src.includes(n)) throw new Error(name+': missing '+n);
if(route.includes("['ceo', 'admin', 'management']")) throw new Error('management must not link verified login identities');
console.log('Verified identity + ration/passport service contract OK');
console.log('Identity-link authorization and manual-review guard contract: PASS');
