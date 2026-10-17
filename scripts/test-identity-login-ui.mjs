import fs from 'node:fs';

const login = fs.readFileSync('app/login/page.tsx','utf8');
const required = [
  'identifierType',
  'aadhaar',
  'jan_aadhaar',
  'pan',
  'voter_id',
  'ration_card',
  'passport',
  'driving_license',
  'identifierType !== \'account\'',
];
for (const token of required) {
  if (!login.includes(token)) throw new Error('missing login UI contract: '+token);
}
if (!login.includes('Verified identity')) throw new Error('missing verified identity login copy');
console.log('IDENTITY_LOGIN_UI_CONTRACT: PASS');
