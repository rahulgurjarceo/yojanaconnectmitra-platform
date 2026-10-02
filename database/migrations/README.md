# YCM ONE production database migrations

Use this directory as the canonical ordered migration set for the production PostgreSQL database.

Run in numeric order:
1. 000_user_auth_and_password_reset.sql
2. 001_customer_family.sql
3. 004_security_sessions_audit.sql
4. 005_family_resources.sql
5. 006_family_payment_binding.sql
6. 007_family_intelligence_operations.sql
7. 008_location_community_requirement_engine.sql
8. 009_family_access_and_flow_hardening.sql
9. 010_ycm_impact_proof.sql
10. 011_ceo_entity_kpi.sql
11. 012_ceo_growth_insights.sql
12. 013_employee_productivity_telemetry.sql
13. 014_employee_compensation_targets.sql
015_organization_hierarchy_team_lead.sql
16. 016_work_approval_and_org_targets.sql
17. 017_geographic_franchise_targets.sql
18. 018_business_domains_and_team_mapping.sql

The older `db/migrations/` directory contains source migrations retained for compatibility. Do not run both trees against the same database unless you have verified the statements are idempotent and intentionally duplicated.

Migration runner:
- `npm run db:migrate` runs the canonical migrations in numeric order.
- It requires `DATABASE_URL` or `POSTGRES_URL` and records applied files in `ycm_schema_migrations`.
- It is intentionally not part of CI; run it explicitly against the intended production database.
- Optional `DATABASE_SSL=disable` can be used only when the database endpoint does not require TLS.

Production prerequisites:
- DATABASE_URL or POSTGRES_URL
- YCM_SESSION_SECRET
- OTP provider configuration
- Payment provider configuration

Never store database credentials or provider secrets in source control.
