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
14. 015_organization_hierarchy_team_lead.sql
15. 016_work_approval_and_org_targets.sql
16. 017_geographic_franchise_targets.sql
17. 018_business_domains_and_team_mapping.sql
18. 019_unified_service_master.sql
19. 020_unified_franchise_models.sql
20. 021_dynamic_service_operating_layer.sql
21. 022_unified_lead_intake.sql
22. 023_individual_family_memberships.sql
23. 024_membership_review_and_special_activation.sql
24. 025_membership_payment_ledger.sql
25. 026_unified_transaction_commission_ledger.sql
26. 027_default_commission_rule.sql
27. 028_aeps_financial_service.sql
28. 029_wallet_settlement_and_payout_destinations.sql
29. 030_settlement_destination_binding.sql
30. 031_auth_login_rate_limit.sql
31. 032_company_financial_control.sql
32. 033_aeps_provider_modes.sql
33. 034_service_geography_scope.sql
34. 035_eko_aeps_retailer_transactions.sql
35. 036_ycm_packages_entitlements_kyc.sql

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
- Provider API credentials must be stored in deployment secrets/secret manager, never in PostgreSQL service configuration.

Never store database credentials or provider secrets in source control.

Membership pricing rule: ₹99 standard Individual/Household = 1 year. Special Family review starts at ₹99 / 1-year base state; after High Management approval, Widow Household or Defense Family becomes ₹99 / 2 years. No defense/government source credentials or raw sensitive government documents are stored in the membership record.
