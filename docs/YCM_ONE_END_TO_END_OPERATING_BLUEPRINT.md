# YCM One — End-to-End Operating Blueprint

This document is the canonical product blueprint for turning YCM One into one unified operating platform.

## 1. Product principle

YCM One is not a directory of schemes or a collection of disconnected mini-apps.

The core journey is:

Authenticate -> Family / Customer context -> Need -> Relevant service -> Eligibility -> Documents / consent -> Application or assisted execution -> Assignment -> Provider / authority result -> Case tracking -> Human Mitra escalation -> Outcome -> Feedback.

Every new capability must plug into this journey instead of creating a parallel product.

## 2. Service Master

The service catalogue must be data-driven. The target of 10,000-50,000 services must not be implemented as 10,000-50,000 hard-coded UI entries.

Each service should eventually have:

- service code and canonical name
- domain and category
- country and optional state
- provider and provider service code
- mode: discovery, assistance, execution, referral, tracking
- consent requirement
- eligibility rules
- document requirements
- service metadata
- lifecycle status
- creator, editor and approver
- commission rule reference
- Family 360 matching metadata

Lifecycle:

Research / Draft -> Manager Edit -> Submit for Approval -> Approval -> Publish -> Family 360 / Service Catalogue -> Pause / Archive.

The existing static Case Universe remains the canonical domain taxonomy. A dynamic service master should sit above it when the production database schema is enabled.

## 3. CEO authority and role separation

CEO is the ultimate authority. Operational permissions are delegated explicitly.

Suggested scopes:

- CEO: full service, commission and operational authority
- Admin: platform administration and approved operational authority
- Management / Service Manager: create and edit services
- Service Approver: approve / publish
- Commission Manager: configure commission rules
- Operations Manager: assignments and execution operations
- Team Leader: team execution
- Research Executive: research and draft only

No research or draft role should be able to publish a service directly.

## 4. Family 360

Family 360 should not expose all services at once.

It should use:

- family members
- age / relation / gender where legitimately required
- location
- documents
- verification state
- consent state
- eligibility rules
- current need
- service availability

to surface the relevant service set.

A service selected for a family should create a structured case / requirement path rather than becoming an isolated form.

## 5. AEPS / banking work

YCM should support an authorised-provider adapter model for AEPS rather than hard-coding one provider.

Conceptual flow:

Customer -> authorised YCM partner / BC touchpoint -> AEPS provider -> NPCI / bank ecosystem -> provider result -> YCM transaction state -> commission calculation -> ledger -> reconciliation -> settlement queue.

Supported transaction categories should be provider-dependent and explicitly configured. The initial adapter contract covers cash withdrawal, cash deposit, balance enquiry, mini statement and Aadhaar-to-Aadhaar transfer.

Transaction states:

initiated -> provider_processing -> success / failed / reversed -> reconciled.

Commission must only be credited after the configured business rule says the transaction is commissionable. Failed / reversed transactions must be reversible.

Actual AEPS access requires an authorised provider / BC arrangement and provider credentials. YCM One itself must not pretend that an API adapter is live until the provider is configured and verified.

## 6. Commission model

Every service may have a versioned commission rule.

Target split:

- Partner commission
- Referral commission
- YCM commission

The split must be validated to total 100%.

The commission engine should calculate paise-level integer amounts and keep the three shares separately identifiable.

Example only (not a production rate):

Gross transaction -> Partner share + Referral share + YCM share = Gross transaction.

Production rates must be entered by CEO / authorised Commission Manager.

## 7. Ledger and settlement

Commission calculation and settlement are separate concerns.

Ledger:

transaction -> calculated share -> credit entry -> reversal entry if needed -> reconciliation.

Settlement:

eligible balance -> settlement request -> provider processing -> settled / failed -> retry or manual review.

Automatic bank payout should only be enabled after a compliant payout provider is configured and its authorization / KYC / limits / reconciliation requirements are satisfied.

Until then, the platform should record a settlement-pending state rather than claiming money was transferred.

## 8. Document intelligence / OCR

The existing document-intelligence architecture is intended to support Aadhaar, Jan Aadhaar and later other Indian documents.

Validation principle:

OCR extraction -> field confidence -> compare against trusted family/member data -> pass / mismatch / manual review.

A material mismatch should block downstream submission until corrected or explicitly routed to human review.

The Hindi mismatch messaging already used by YCM should remain consistent.

No system should promise 0% rejection; the product should reduce avoidable rejection and preserve human review for uncertainty.

## 9. Provider integration registry

Provider adapters are configuration-driven.

Priority areas include:

P0: OCR, DigiLocker/API Setu, Jan Aadhaar, LGD, maps, WhatsApp, SMS/OTP, payments.

P1: PAN, GST, Udyam, bank verification, voter, driving licence, passport, education and state services.

P2: grievance, AEPS/DMT/BBPS, insurance, loans, jobs and admissions.

P3: travel, business and other service adapters.

Provider credentials belong only in server-side environment configuration.

## 10. WhatsApp / lead intake

WhatsApp should become another entry channel into the same YCM workflow.

Lead / enquiry -> identify customer -> create or join family -> capture need -> match service -> create case / assignment -> human follow-up.

WhatsApp must not create a separate CRM universe.

## 11. Operations

CEO Command Center:

- live assignment queue
- team / assignee visibility
- priorities
- due dates
- blocked work
- service / case / document source
- audit history

Employee / Mitra Workspace:

- assigned work
- accepted / in-progress / blocked / completed states
- family / case context
- next action

The same assignment engine should be reusable for Family 360, document review, service execution, research and lead follow-up.

## 12. Security

Production requirements:

- authenticated role checks
- family scope checks
- server-side authorization
- UUID resolution for database actors
- no raw OCR fields exposed unnecessarily
- audit events for privileged changes
- secrets only in server environment
- provider calls server-side
- settlement actions require explicit provider integration and authorization

## 13. Engineering discipline

Every meaningful change should be committed in small, reviewable increments.

CI should run lint, build and eventually automated tests. GitHub recommends Node.js workflows that install with npm ci and run build/test steps. The goal is to catch regressions before merging.

## 14. Current implementation boundary

Already present in the codebase:

- Family 360 authentication and owner access
- requirement status and KYC UI
- document validation audit flow
- CEO assignment control
- employee assignment workspace
- runtime actor / assignee hardening
- static 35-domain service taxonomy
- integration registry
- provider-neutral OCR abstraction
- provider-neutral AEPS contract
- reusable commission calculation engine
- service governance permission model

Not yet live:

- dynamic 10k-50k service database master
- production commission ledger / settlement tables
- real AEPS provider integration
- real payout provider
- production OCR provider
- production OTP / WhatsApp providers

Those must be marked as configured only after real provider onboarding and environment configuration.

## 15. Product rule for future ideas

When Rahul adds a new thought:

1. identify the user/business outcome;
2. place it in the correct YCM One module;
3. reuse existing family, service, case, assignment and audit primitives;
4. avoid duplicate systems;
5. add the requirement to this blueprint;
6. implement the smallest production-safe increment;
7. lint/build/test before merge.

The objective is one YCM One operating system, not a growing pile of disconnected features.
