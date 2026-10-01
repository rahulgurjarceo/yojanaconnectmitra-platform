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

The older `db/migrations/` directory contains source migrations retained for compatibility. Do not run both trees against the same database unless you have verified the statements are idempotent and intentionally duplicated.

Production prerequisites:
- DATABASE_URL or POSTGRES_URL
- YCM_SESSION_SECRET
- OTP provider configuration
- Payment provider configuration

Never store database credentials or provider secrets in source control.
