import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const files=['database/migrations/029_wallet_settlement_and_payout_destinations.sql','database/migrations/030_settlement_destination_binding.sql','app/lib/ycm-settlement.ts','app/api/settlements/route.ts','app/api/settlements/release/route.ts','app/api/payout-destinations/route.ts'];
for(const f of files)if(!fs.existsSync(f))throw new Error('SETTLEMENT_CONTRACT_FAILED:'+f);
const m=read(files[0]);for(const needle of ['withdrawable_paise','settlement_eligible_at','ycm_payout_destinations'])if(!m.includes(needle))throw new Error('SETTLEMENT_CONTRACT_FAILED:'+needle);
if(!read('app/api/settlements/route.ts').includes('SETTLEMENT_NOT_ELIGIBLE_T1'))throw new Error('SETTLEMENT_CONTRACT_FAILED:T1 gate');
console.log('T+1 settlement contract checks passed.');
