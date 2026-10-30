import fs from 'node:fs';
import assert from 'node:assert/strict';
const migration=fs.readFileSync('database/migrations/063_ai_voice_sales_engine.sql','utf8');
const docs=fs.readFileSync('docs/YCM_AI_VOICE_SALES_ENGINE.md','utf8');
for(const token of ['ycm_ai_contact_preferences','ycm_ai_voice_campaigns','ycm_ai_voice_call_jobs','ycm_ai_message_events','ycm_ai_voice_audit_events','idempotency_key','do_not_contact','consent_status']) assert.ok(migration.includes(token), 'missing migration contract: '+token);
for(const token of ['existing CRM','channel-specific consent','DND','TRAI','AI assistant','human escalation','Secrets']) assert.ok(docs.toLowerCase().includes(token.toLowerCase()), 'missing design control: '+token);
console.log('YCM_AI_VOICE_SALES_FOUNDATION: PASS');
