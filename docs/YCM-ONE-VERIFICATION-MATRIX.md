# YCM ONE — Verification Matrix and Release Gates

**Assessment date:** 2026-10-14  
**Evidence commit assessed:** `6df42188e52aed803f673520cc61693d10d351ff`  
**CI run:** `38124435471` (YCM One CI, run 1735)  
**Scope:** Repository/CI evidence only. This document is not a claim that production services are live.

## 1. Verified CI evidence

The recorded workflow run completed successfully. The `verify` and `security-release-audit` jobs both concluded `success`.

| Gate | Recorded result | Evidence/limit |
|---|---|---|
| Dependency installation (`npm ci`) | PASS | CI step completed |
| ESLint | PASS | CI step completed |
| Dependency audit (`npm audit --audit-level=high`) | PASS | This is not a full penetration test |
| Contract tests in CI | PASS | See workflow steps for the exact list |
| Production build (`npm run build`) | PASS | Build success does not prove deployment |
| Release audit contract | PASS | Automated contract only |
| Portable Docker build | PASS | Image build only; not proof of deployed runtime |
| Audit evidence artifact | Uploaded | Workflow says evidence upload succeeded |

Workflow: https://github.com/rahulgurjarceo/yojanaconnectmitra-platform/actions/runs/38124435471  
Assessed commit: https://github.com/rahulgurjarceo/yojanaconnectmitra-platform/commit/6df42188e52aed803f673520cc61693d10d351ff  
PR #6: https://github.com/rahulgurjarceo/yojanaconnectmitra-platform/pull/6

## 2. Areas covered by passing contract tests

- Service Master, service lifecycle, application authorization and geography scope.
- Family registration/resources, membership and payment contracts.
- Login, session cookie, RBAC, document access and employee verification security contracts.
- Financial ledger, reconciliation, settlement, financial webhooks and payout destination contracts.
- EKO AEPS provider contract, retailer flow, callback replay and provider-mode contracts.
- DigiLocker and Jan Aadhaar integration contracts.
- Case operations, dispatch and escalation contracts.
- Voice Mitra, IVR, voice-form assistant and universal 35-domain journey contracts.
- Company finance controls, expenses, assets and reports.
- Release audit, integration readiness and YCM ONE completion contracts.

Passing contract tests verify the assertions in those tests; they do not prove every real-world workflow or external integration works.

## 3. Release blockers / evidence still required

### P0 — must be closed before production sign-off

- [ ] Recheck PR #6 current base/head SHAs, mergeability, review state and required checks at release time.
- [ ] Confirm production database schema and migration status. PR #6 explicitly states that the dynamic Service Master production DB migration is not included.
- [ ] Run reviewed migrations against a staging database with backup/rollback evidence.
- [ ] Verify production environment variables and secret configuration without exposing secret values.
- [ ] Run end-to-end login/session/role authorization tests against a running staging deployment.
- [ ] Run EKO sandbox initiation and inquiry with provider-issued sandbox credentials; retain redacted request/response evidence.
- [ ] Verify uncertain AEPS outcomes are inquired before retry and that callbacks/inquiry cannot double-credit the ledger.
- [ ] Run payment → webhook verification → membership activation → ledger → reconciliation end-to-end in sandbox.
- [ ] Verify deployed health/readiness endpoints and inspect runtime logs.

### P1 — required for release confidence

- [ ] Test family onboarding and membership purchase on desktop/mobile.
- [ ] Test service application creation, document access boundaries, case assignment and escalation.
- [ ] Test payment timeout, duplicate callback, invalid signature, provider outage and retry paths.
- [ ] Perform staging backup/restore test and confirm rollback instructions.
- [ ] Perform basic load/performance test and confirm monitoring/alerting.

## 4. EKO AEPS request-hash integration note

The assessed API route requires `aadhaarForRequestHash` and passes it to the provider adapter. The provider adapter validates a 12-digit value and documents that the value is transient and must not be persisted or included in the provider body.

Still required: verify the actual UI/secure device flow supplies the correct transient value, test the provider's documented hash sequence against official EKO sandbox documentation, and confirm that neither application logs nor database rows retain plaintext Aadhaar. Do not use real customer Aadhaar data in test fixtures.

## 5. Release decision

**Current decision: NOT YET CLEARED FOR PRODUCTION.**

Reason: CI and the recorded security-release workflow pass, but the available evidence does not establish live deployment, completed production DB migration, real provider sandbox success, or full end-to-end financial reconciliation.

Release sign-off requires dated evidence for each P0 checkbox, tied to the exact release commit. Never mark a gate complete based only on a code-presence or contract test.


## 6. Follow-up checkpoint — 2026-10-14

- PR #6 remains open and unmerged; the current PR head inspected is `5acf7f242fb992da0a085058b451d4dcb00feeb9`, targeting `main` at `f14906953a46f217fd83de572e636e220f8fa5ca`.
- A YCM One CI run for the current PR head is recorded as completed/success: run #1751, ID `38250011434`. The connector exposes the run status but not per-job logs here; inspect the GitHub Actions run for job-level details.
- The tested callback replay contract targets `app/api/integrations/eko/aeps/callback/route.ts`. A separate route exists at `app/api/aeps/eko/callback/route.ts`; code inspection shows it updates the AEPS transaction status but does not invoke the financial-ledger success/reversal functions. This may be an unused or legacy endpoint, but its intended use and provider callback URL must be confirmed before release. Do not configure EKO to use it until ledger reconciliation behavior is verified or corrected.
- The separate audit branch is not suitable for a PR/merge as-is: comparison reports it 1,045 commits ahead of `main`. Keep it isolated; do not merge it into `main`. The two audit documents are evidence/runbook additions, not application changes.

### New release checks

- [ ] Confirm which EKO callback URL is configured with the provider; document one canonical callback route.
- [ ] Either retire the unused duplicate callback route or bring it under the same authenticated, idempotent ledger reconciliation contract and add a focused test.
- [ ] Inspect run #1751 job-level output and retain exact-SHA evidence for the release candidate.
