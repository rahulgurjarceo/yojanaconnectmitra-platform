import fs from "node:fs";
const route = fs.readFileSync("app/api/integrations/digilocker/authorize/route.ts", "utf8");

const required = [
  'verifySession',
  'DIGILOCKER_CLIENT_ID',
  'DIGILOCKER_REDIRECT_URI',
  'DIGILOCKER_AUTHORIZATION_URL',
  'DIGILOCKER_NOT_CONFIGURED',
  'state',
  'no-store',
];

for (const token of required) {
  if (!route.includes(token)) throw new Error(`Missing DigiLocker security/config contract: ${token}`);
}

if (!route.includes('url.searchParams.set("state", state)')) {
  throw new Error("DigiLocker authorization must bind a state value.");
}

console.log("DigiLocker authorization contract checks passed.");

const callback = fs.readFileSync("app/api/integrations/digilocker/callback/route.ts", "utf8");
for (const token of ["timingSafeEqual", "DIGILOCKER_OAUTH_STATE_INVALID", "DIGILOCKER_TOKEN_EXCHANGE_NOT_CONFIGURED", "maxAge: 0"]) {
  if (!callback.includes(token)) throw new Error(`Missing DigiLocker callback security contract: ${token}`);
}
console.log("DigiLocker callback contract checks passed.");
