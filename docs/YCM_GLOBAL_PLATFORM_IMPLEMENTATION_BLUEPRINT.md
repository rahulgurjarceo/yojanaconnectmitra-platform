# YCM Global Platform — Implementation Blueprint

**Repository:** `rahulgurjarceo/yojanaconnectmitra-platform`  
**Base:** Existing YCM ONE platform; this is an additive implementation plan, not a rewrite.  
**Status:** Architecture proposal; no production deployment or external-country launch is implied.

## 1. Product objective

Extend YCM ONE from an India-first assisted-services platform into a country-configurable family, service and case-assistance platform. Keep one shared product core and isolate country-specific rules, service catalogues, identity attributes, providers, payments, language and compliance.

## 2. Existing repository baseline

The current repository uses:
- Next.js App Router, React and TypeScript.
- PostgreSQL through the `postgres` client.
- SQL migrations under `database/migrations`, executed by the repository migration runner.
- Existing YCM ONE capabilities including service governance, Family 360 workflows, customer/partner operations, finance controls, AI/voice foundations and CEO command-centre surfaces.

**Compatibility rule:** extend the current stack. Do not introduce MongoDB, a second backend framework, or a second database without an approved architecture decision. Reuse existing authentication, session, RBAC, audit, consent and migration conventions.

## 3. Target architecture

```text
Public Web / Customer PWA / Mitra Portal / Partner Portal / Admin
                              |
                       Next.js App Router
                              |
                 Existing authenticated API layer
                              |
   ---------------------------------------------------------
   | Identity & Consent | Family 360 | Service Master      |
   | Need & Case Flow    | Documents  | Partner & CRM       |
   | Payments/Ledger    | AI Mitra   | Analytics/Impact    |
   ---------------------------------------------------------
                              |
            PostgreSQL + encrypted object storage
                              |
             Async workers / queues / notifications
                              |
        Approved country providers and external APIs
```

Start as a modular monolith with clear module boundaries and asynchronous workers for slow or retryable work. Extract services only when scale, isolation or team ownership justifies it.

## 4. Core domain boundaries

1. **Identity & Access:** user, role, session, MFA, tenant/country scope, staff access.
2. **Consent & Privacy:** purpose-specific consent, evidence, withdrawal, retention and deletion requests.
3. **Family 360:** family, members, relationships, verified facts and access permissions.
4. **Service Master:** versioned service catalogue with country, state/province, district, provider, eligibility source, document checklist, fees, SLA, availability and approval status.
5. **Need & Case Management:** need intake → triage → service match → checklist → referral/application → tracking → outcome/evidence → escalation.
6. **Document Intelligence:** encrypted file metadata, access logs, malware scanning, OCR extraction and human correction; never treat OCR as authoritative identity verification.
7. **Partner & Mitra Network:** onboarding, due diligence, scopes, assignments, performance and suspension controls.
8. **Payments & Ledger:** provider-neutral payment adapter, idempotent webhooks, reconciliation, refunds and immutable transaction history. Do not store card data.
9. **AI Mitra:** retrieval from approved, dated knowledge; source references, confidence thresholds, refusal/escalation paths and evaluation logs.
10. **Analytics & Impact:** role-scoped operational metrics, finance reconciliation and consented, evidence-backed outcomes.

## 5. Country configuration model

Each country is a governed configuration pack, not a fork of the application:
- ISO country code, locale, language and timezone.
- Supported service catalogue and jurisdiction hierarchy.
- Approved identity/document types and verification providers.
- Payment, messaging and notification adapters.
- Data residency/transfer, retention and privacy controls.
- Local legal entity/partner, licensing and consumer disclosures.
- Service owner, source URL/reference, last-reviewed date and publication approval.

A service must remain unpublished until its official source, jurisdiction, eligibility, fee disclosure, provider authority and review date are approved. Country selection in the UI alone does not mean service availability.

## 6. Security and reliability requirements

- Deny-by-default authorization; enforce role and geography scope on every API.
- Purpose limitation and minimum data collection; explicit consent for sensitive workflows.
- Encrypt data in transit and at rest; keep secrets in a managed secret store.
- Record admin/staff access and sensitive changes in tamper-evident audit trails.
- Rate-limit authentication, OTP and public intake; protect against replay and duplicate webhooks.
- Validate uploads, scan files, restrict MIME/size, and use short-lived signed access.
- Backups, restore drills, monitoring, incident response and vulnerability remediation.
- AI must not make final legal, medical, credit, benefit-eligibility or identity decisions.

## 7. Delivery phases and acceptance gates

### Phase 0 — Baseline and release safety
- Inventory routes, migrations, roles, integrations, open PRs and deployed version.
- Run lint, full test suite, production build, dependency audit and release audit.
- Confirm staging database backup and migration rollback/forward-recovery plan.
- **Gate:** no unresolved critical/high security issue; CI green; production/staging state understood.

### Phase 1 — India-first core hardening
- Reconcile Family 360, consent, document vault, Service Master and case lifecycle.
- Ensure all service records have jurisdiction, source, owner, review date and publication status.
- Add operational monitoring for failed jobs, pending cases, webhook replay and reconciliation.
- **Gate:** controlled pilot with real consent, support, refund and escalation processes.

### Phase 2 — Country-ready configuration
- Add country/jurisdiction configuration and locale infrastructure.
- Add country-scoped service search and provider registry.
- Add data export/deletion, retention and country-level access controls.
- **Gate:** security/privacy review and local legal review for one selected pilot market.

### Phase 3 — One overseas pilot
- Select one country only after demand, partner, legal and data-transfer due diligence.
- Launch a narrow non-regulated service catalogue through vetted local partners.
- Measure paid conversion, service completion, complaints, refunds and contribution margin.
- **Gate:** documented unit economics and local compliance approval before expansion.

### Phase 4 — Repeatable expansion
- Turn the pilot into a country-launch playbook.
- Add more countries only after each passes the same legal, security, partner and economics gates.

## 8. First engineering backlog

| Priority | Work item | Acceptance criteria |
|---|---|---|
| P0 | Repository and deployment inventory | Current branch, deployed SHA, migrations, open PRs and environment status documented |
| P0 | Authorization review | Every sensitive API has server-side role, ownership and jurisdiction checks |
| P0 | Consent audit | Consent purpose, source/evidence, timestamp and withdrawal are traceable |
| P1 | Service Master completeness | Required governance metadata validated before publication |
| P1 | Country configuration schema | Country and jurisdiction configuration is versioned and test-covered |
| P1 | Document access controls | Private storage, scoped access, audit and retention controls verified |
| P1 | Case lifecycle observability | Status history, SLA, retry and escalation metrics available |
| P2 | Provider adapter contracts | Sandbox-tested, idempotent integrations with reconciliation |
| P2 | AI Mitra evaluation | Grounded-answer tests, source references and human escalation pass |
| P3 | Pilot-market readiness | Legal, privacy, partner, support and unit-economics sign-offs recorded |

## 9. Definition of done

A feature is not production-ready merely because its UI exists. It must include:
- Database migration and migration test where applicable.
- Server-side authorization and input validation.
- Audit and consent behavior where relevant.
- Automated contract/security tests.
- Accessible responsive UI and error/empty/loading states.
- Monitoring, operational owner and support SOP.
- Documentation and successful CI/build checks.

## 10. Explicit non-goals for the first release

- Building a new operating system or cloud provider.
- Training a foundation model from scratch.
- Launching in 50–100 countries at once.
- Holding customer funds or issuing financial products without required authorizations.
- Direct access to government identity databases without approved agreements.
- Claiming official verification or guaranteed benefit/loan/visa outcomes.

**North-star principle:** one secure YCM ONE core, governed country-specific service packs, and measurable customer outcomes.
