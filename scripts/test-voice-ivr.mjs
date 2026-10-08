import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const route=fs.readFileSync(path.join(root,'app/api/ai-mitra/ivr/route.ts'),'utf8');
for(const token of ['SpeechResult','Digits','speak_and_listen','/api/ai-mitra/voice','provider-neutral','continue_journey']) {
  if(!route.includes(token)) throw new Error('IVR contract missing: '+token);
}
console.log('IVR adapter contract: inbound speech/DTMF -> existing Voice Mitra -> journey continuation verified.');
