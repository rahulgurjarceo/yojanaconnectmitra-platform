# YCM ONE — Staging Verification Runbook

**Purpose:** Safely gather release evidence before any production deployment.  
**Rule:** Do not run migrations against production as a diagnostic step. Use a disposable/staging PostgreSQL database first.

## A. Pin the code under test

Record these values in the release ticket:
- Repository: `rahulgurjarceo/yojanaconnectmitra-platform`
- Candidate commit SHA:
- Branch:
- CI run URL and result:
- Staging deployment URL:
- Tester and timestamp:

Never describe a result from one SHA as verification of another SHA.

## B. Repository and CI gates

1. Open the candidate commit and confirm the SHA.
2. Confirm a fresh GitHub Actions run exists for that SHA.
3. Require all mandatory workflow jobs to pass; review failed/skipped jobs, not just the overall badge.
4. Confirm dependency audit, lint, contract suite, production build, release-audit job, and Docker build.
5. Save the audit artifact and workflow URL with the release evidence.

Useful commands in a trusted checkout:
```sh
git status --short
git rev-parse HEAD
npm ci
npm run lint
npm audit --audit-level=high
npm run test:migration
npm run test:eko-aeps
npm run test:financial-ledger
npm run test:settlement
npm run test:security-contracts
npm run build
```
Run the same complete command list configured in the candidate CI workflow; the subset above is an additional focused smoke set, not a replacement for CI.

## C. Migration verification — staging only

1. Provision an isolated PostgreSQL staging database and take a snapshot before the test.
2. Supply staging-only `DATABASE_URL` or `POSTGRES_URL` through the secret manager.
3. Check `database/migrations/README.md` and inspect the migration diff before applying.
4. Confirm the target database identity/host is staging, not production.
5. Run `npm run db:migrate` against staging.
6. Capture output showing applied/skipped migration filenames; do not capture credentials.
7. Query `ycm_schema_migrations` and compare applied filenames with the canonical migration directory.
8. Run service-master, family, payment, ledger, settlement and authorization smoke tests against staging.
9. Verify a second migration run is safely idempotent for the current migration set.
10. Test restore/rollback using the staging snapshot and document recovery time.

Do not run `npm run db:migrate` until the database target has been positively confirmed. Do not use production data or real Aadhaar/PID data in test fixtures.

## D. EKO AEPS sandbox

Prerequisites: provider-approved sandbox access and test identities from EKO. Never paste secrets or customer identity data into issues, logs, or this document.

Test and capture redacted evidence for:
- Missing configuration is rejected safely.
- Unsupported transaction type is rejected.
- Non-cash transaction amount must be zero.
- Cash withdrawal amount validation behaves as intended.
- Provider initiation success, failure, pending/unknown response and timeout.
- Timeout leaves the transaction in an inquiry-required state; client must inquire before retry.
- Inquiry returns the provider state and binds the request to the authenticated user's transaction.
- Duplicate callbacks/replayed callbacks do not double-credit.
- Ledger entry is idempotent and reconciliation agrees with the provider sandbox result.
- No plaintext Aadhaar, PID data, API keys, or signatures are persisted/logged.

Record the sandbox transaction reference, redacted response, expected state, actual state, ledger result and tester. Do not claim provider verification until a real sandbox response has been observed.

## E. Membership/payment end-to-end

Using a provider sandbox and synthetic customer:
1. Create the membership order.
2. Complete the sandbox payment.
3. Test valid, invalid, duplicate and replayed webhook cases.
4. Verify membership activation occurs only after verified payment.
5. Verify a failed/uncertain payment does not activate membership prematurely.
6. Confirm the ledger has exactly one entry for a successful payment.
7. Reconcile provider amount, internal ledger and membership status.
8. Test refund/failure handling where supported.

## F. Staging application smoke tests

- [ ] Unauthenticated requests receive 401.
- [ ] Unauthorized roles receive 403.
- [ ] A user cannot read another user's family, document, payment or AEPS transaction.
- [ ] Service search and service details work with geographic scope filters.
- [ ] A draft service cannot be published without the required permission/approval.
- [ ] Family onboarding and consent work end-to-end.
- [ ] Service application can be created, tracked and escalated.
- [ ] Agent/partner/admin dashboards show only permitted data.
- [ ] Health and readiness endpoints match actual database/provider readiness.
- [ ] Runtime logs contain no secrets, Aadhaar, PID payloads or payment credentials.
- [ ] Backup restore and deployment rollback are documented and tested.

## G. Sign-off format

For every test, record:
`test_id | candidate_sha | environment | timestamp | expected | actual | PASS/FAIL/BLOCKED | evidence_url | owner`

Release gates:
- CI/security audit: PASS required.
- Staging migrations and rollback: PASS required.
- EKO sandbox and financial reconciliation: PASS required.
- Authorization/privacy smoke tests: PASS required.
- Production deployment health check: PASS required after deployment.

**Release status remains BLOCKED** until all P0 gates have dated evidence tied to the exact release SHA. A green CI run alone is not production sign-off.
