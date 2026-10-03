# YCM ONE — Audit Readiness Control Matrix

This is an engineering audit-readiness register, not a government certification or audit result.

Status definitions:
- PASS — implemented and statically/contract verified in repository.
- PARTIAL — control exists but requires runtime, environment, integration, or broader verification.
- BLOCKED — required evidence/credential/contract is not yet available.
- NOT STARTED — control has not yet been implemented.

| Area | Status | Next verification |
|---|---|---|
| Authentication/session signing | PASS | Runtime and production configuration verification |
| Role/path authorization | PASS | Endpoint-by-endpoint authorization tests |
| Login abuse protection | PARTIAL | Distributed production rate-limit design |
| Session revocation/versioning | PARTIAL | Production availability and recovery testing |
| Audit event model | PARTIAL | Coverage, retention and immutability review |
| Security headers | PASS | Production browser/UAT verification |
| Provider metadata exposure | PASS | Regression tests |
| Database migration inventory | PASS | Canonical list includes migrations through 034 |
| Database migration execution | BLOCKED | Staging/production rehearsal and evidence |
| Database backup/restore | NOT STARTED | Restore drill and recovery evidence |
| Database least privilege | NOT STARTED | Separate runtime/migration roles and grants |
| Encryption/key management | PARTIAL | Production key management and rotation evidence |
| PII minimization/redaction | PARTIAL | Full endpoint and data-flow review |
| File upload security | NOT STARTED | Type/size/content scanning and isolation |
| CSRF protection | PARTIAL | Final cookie-mutation CSRF strategy and tests |
| Financial ledger/idempotency | PASS | Runtime reconciliation evidence |
| Settlement controls | PARTIAL | Scheduler, reconciliation and DR testing |
| AEPS webhook authenticity | PARTIAL | Provider-specific callback verification |
| EKO callback authenticity | BLOCKED | Official provider callback verification contract |
| Payment webhook verification | PARTIAL | Gateway-specific official signature verification |
| Jan Aadhaar integration | BLOCKED | UAT credentials/certs/IP allowlist/endpoint contract |
| DigiLocker integration | PARTIAL | Official token exchange and UAT evidence |
| Dependency/SCA scanning | NOT STARTED | CI vulnerability gate |
| SAST | NOT STARTED | CI static security analysis |
| DAST/API security testing | NOT STARTED | Staging deployment and authenticated testing |
| Monitoring/alerting | PARTIAL | Production observability and alert thresholds |
| Incident response | NOT STARTED | Incident runbook and drill |
| Business continuity/DR | NOT STARTED | RPO/RTO, backup restore and failover drill |
| Access review | NOT STARTED | Periodic privileged-access certification |
| Change management | PARTIAL | Release approval and evidence retention |
| Production deployment | BLOCKED | Hosting, secrets, DB and provider prerequisites |
| Government audit evidence pack | NOT STARTED | Completed controls, logs, approvals and test reports |

## Release gate
Before live launch require: CI/build/tests green; database migration rehearsal and evidence; security test evidence; provider UAT evidence; backup/restore evidence; privileged-access review; incident/DR readiness; production secrets review; and final human security/compliance review.

## Audit rule
No control is marked PASS merely because source code exists when the control depends on production configuration, external provider behavior, infrastructure, operational evidence, or an independent audit.