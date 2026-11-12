# Yojana Connect Mitra Platform (YCM ONE)

YCM ONE is the existing platform repository for Yojana Connect Mitra Pvt. Ltd. It is being developed as an India-first assisted-services, family support and case-management platform, with a country-configurable architecture planned for future expansion.

> **Project status:** Active development. Repository features, contract tests and CI checks do not by themselves prove production deployment, provider approval, legal compliance or live service availability.

## Technology

- Next.js App Router, React and TypeScript
- PostgreSQL using the `postgres` client
- SQL migrations in `database/migrations/`
- Server-side session and role/access-control utilities
- API routes and management/customer-facing application pages

Do not introduce a second database or backend framework without an explicit architecture decision. Extend existing modules and conventions.

## Main product areas

The repository contains foundations and ongoing work for:

- Family 360 and customer/family registration
- Service Master, service governance and geography-scoped service workflows
- Partner, Mitra, employee and CRM operations
- Case/application lifecycle and customer support journeys
- Finance controls, ledger and settlement foundations
- AEPS/provider integration foundations
- Document intelligence and identity-workflow foundations
- AI Mitra, voice/IVR and lead operations
- CEO Command Center, operational analytics and impact proof

Feature maturity varies. Check the relevant tests, migrations, provider sandbox evidence and deployment status before describing any module as production-ready.

## Local development

Requirements: a supported Node.js version (Next.js 16 requires Node.js 20.9 or newer) and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Database migrations

The migration runner reads `DATABASE_URL` or `POSTGRES_URL` and applies numbered SQL files in `database/migrations/`. It uses a migration ledger and PostgreSQL advisory lock.

Before running against any shared or production database:

1. Confirm the target database and environment.
2. Take and verify a restorable backup.
3. Review every unapplied migration in order.
4. Rehearse on staging and record the result.
5. Run only with the approved migration credentials.

```bash
npm run db:migrate
npm run test:migration
```

Never paste database credentials or provider secrets into source control, issues or chat.

## Validation commands

The repository exposes focused contract/security tests through npm scripts. Useful examples:

```bash
npm run lint
npm run build
npm run test:migration
npm run test:release-audit
npm run test:security-contracts
npm run test:ycm-one-completion
```

Run the relevant module tests as well. A static contract test is not a substitute for integration tests, provider sandbox tests, browser/UAT, load tests or production monitoring.

## Security and operational principles

- Enforce authentication, role, ownership and geography scope on the server for every protected operation.
- Collect only the minimum data needed; record purpose-specific consent and withdrawal.
- Never store Aadhaar numbers or identity-document images in campaign/lead tables.
- Keep customer documents in private, access-controlled storage with retention and audit controls.
- Verify provider webhook signatures and enforce idempotency/replay protection.
- Keep live payments, AEPS, OTP, voice and government integrations disabled until credentials, provider contracts, UAT and compliance checks are complete.
- Do not claim guaranteed government benefits, loan/insurance approvals or official identity verification.
- Do not run migrations or deploy to production without explicit environment and release approval.

## Architecture and audit documents

- [YCM Global Platform Implementation Blueprint](docs/YCM_GLOBAL_PLATFORM_IMPLEMENTATION_BLUEPRINT.md)
- [YCM ONE Audit Readiness Control Matrix](docs/YCM_ONE_AUDIT_READINESS_MATRIX.md)
- [YCM Global Implementation Status — 12 Nov 2026](docs/YCM_GLOBAL_IMPLEMENTATION_STATUS_2026-11-12.md)

## Contribution workflow

1. Work in a feature/fix branch; do not commit directly to `main`.
2. Inspect existing schema, auth, API and test conventions before adding a module.
3. Add additive migrations and focused tests where required.
4. Run lint, relevant tests, dependency/security audit and production build.
5. Open a pull request with scope, migration impact, security notes, test evidence and deployment prerequisites.
6. Merge/deploy only after review and all required checks pass.

## Important

This repository is not evidence that YCM is live in every state or country. Country launch requires verified local service sources, lawful provider arrangements, privacy/data-transfer review, operational support and positive unit economics.
