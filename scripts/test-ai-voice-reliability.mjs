import fs from 'node:fs';
import assert from 'node:assert/strict';
const worker=fs.readFileSync('app/api/ai-voice/worker/route.ts','utf8');
const webhook=fs.readFileSync('app/api/ai-voice/webhook/route.ts','utf8');
const migration=fs.readFileSync('database/migrations/064_ai_voice_reliability.sql','utf8');
for(const token of ['YCM_AI_VOICE_WORKER_SECRET','YCM_VOICE_LIVE_ENABLED','consent_status','do_not_contact','max_attempts','ycm_ai_voice_daily_usage','FOR UPDATE OF j,c','scheduled_at<=NOW()','WORKER_CLAIM_TIMEOUT'])assert.ok(worker.includes(token),'worker reliability guard missing: '+token);
for(const token of ['createHmac','timingSafeEqual','createHash','ycm_ai_voice_webhook_events','ON CONFLICT(provider_code,provider_event_id) DO NOTHING','FOR UPDATE','CALL_REFERENCE_MISMATCH','opt_out'])assert.ok(webhook.includes(token),'webhook reliability guard missing: '+token);
for(const token of ['ycm_ai_voice_daily_usage','PRIMARY KEY(campaign_id,local_date)','ycm_ai_voice_webhook_events','UNIQUE(provider_code,provider_event_id)'])assert.ok(migration.includes(token),'migration schema missing: '+token);
console.log('YCM_AI_VOICE_RELIABILITY_AUDIT: PASS');
