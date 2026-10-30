# YCM AI Voice Sales Engine

## Decision
Build this inside the existing `rahulgurjarceo/yojanaconnectmitra-platform` application. Do not create a separate CRM. Existing CRM lead routing, lead call outcomes, Voice Mitra, IVR, authentication and PostgreSQL migrations remain the system of record.

## Current repository baseline
- Next.js 16 / TypeScript / PostgreSQL (`postgres` client).
- Existing lead tables and CRM APIs: `ycm_leads`, `/api/crm/lead-calls`, `/api/crm/lead-routing`.
- Existing voice capabilities: `/api/ai-mitra/voice`, `/api/ai-mitra/ivr`, Voice Mitra UI.
- Existing migration runner: `npm run db:migrate`.

## Target workflow
1. Import/create a lead in the existing CRM.
2. Record channel-specific consent and source. Unknown or withdrawn consent is never callable/messageable.
3. Create a draft campaign with a reviewed script, languages, schedule, daily cap and retry cap.
4. Queue eligible leads using an idempotency key.
5. Worker checks consent, DND/opt-out, local calling window, campaign status, daily limit and retry limit immediately before every provider request.
6. Provider adapter places the call. AI identifies itself as an AI assistant, follows the approved script, handles opt-out and offers human transfer/callback.
7. Store call outcome, transcript/summary, provider reference and audit event. Avoid storing unnecessary sensitive conversation content.
8. Send only approved, registered templates over permitted channels after checking channel-specific consent again.
9. Update existing CRM lead status and conversion records; never mark a lead converted solely because the call ended or a link was sent.

## Architecture
- Existing Next.js API + PostgreSQL remain the application core.
- A separately deployable worker claims queued jobs with PostgreSQL row locking and bounded concurrency.
- Provider-neutral interfaces isolate telephony, speech-to-text, LLM, text-to-speech, SMS and WhatsApp vendors.
- Self-hostable components can reduce software licensing, but PSTN/SIP connectivity, phone numbers, carrier traffic, hosting and some AI inference still have operating costs.
- Secrets are deployment environment variables/secret manager only; never commit API keys.

## Safety and India launch gates
- No outbound promotional call or message without valid, channel-specific consent and a traceable source.
- Respect DND, customer opt-out and suppression lists; apply current TRAI/TCCCPR, DLT, numbering, template and consent requirements before launch.
- Restrict campaigns to approved local time windows; enforce daily and retry limits.
- Disclose that the caller is an AI assistant and provide a human escalation path.
- Recording/transcription requires appropriate notice, lawful basis and retention controls.
- No deceptive claims, guaranteed scheme/loan/insurance approvals, or impersonation of a government office.
- Keep real calls disabled until provider credentials, compliance registration, scripts, templates and consent evidence are verified.

## Migration
Migration `063_ai_voice_sales_engine.sql` adds provider-neutral consent, campaign, outbound call job, message event and audit tables. It does not initiate calls and is not automatically applied to production. Run `npm run db:migrate` only after reviewing the migration and selecting the intended database.

## Delivery sequence
- Phase 1: schema, consent model, campaign/job APIs, dashboard and test coverage.
- Phase 2: provider adapter + sandbox call, webhook signature verification and job worker.
- Phase 3: Hindi/English real-time conversation, human transfer, recording/transcript retention controls.
- Phase 4: registered SMS/WhatsApp templates, payment/registration deep links and conversion attribution.
- Phase 5: load, security, compliance and production readiness tests.

## Required deployment configuration (names only; values remain secret)
- DATABASE_URL
- YCM_SESSION_SECRET
- YCM_VOICE_PROVIDER
- YCM_VOICE_ACCOUNT_ID
- YCM_VOICE_AUTH_TOKEN
- YCM_VOICE_FROM_NUMBER
- YCM_VOICE_WEBHOOK_SECRET
- YCM_AI_PROVIDER / model credentials
- YCM_SMS_PROVIDER credentials
- YCM_WHATSAPP_PROVIDER credentials

Do not enable calling just by setting credentials: provider webhooks, consent checks, DND suppression and compliance gates must pass first.
