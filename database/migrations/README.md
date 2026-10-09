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
36. 037_government_contacts_grievance.sql
37. 038_government_manager_scopes.sql
38. 039_service_lifecycle_document_rules.sql
39. 040_verified_login_identifiers.sql
40. 041_ration_passport_service_master.sql
41. 042_family_case_application_link.sql
42. 043_family_case_operations.sql
43. 044_case_cri.sql
44. 045_case_human_mitra_operations.sql
45. 046_default_case_escalation_rules.sql
46. 047_case_routing.sql
47. 048_family_operating_geography.sql
48. 049_document_validity_kyc_compliance.sql
49. 050_service_application_compliance_intelligence.sql
50. 051_customer_profile_opportunities_notes_sharing.sql
51. 052_employee_verification_vetting.sql
52. 053_enterprise_lead_routing_cross_sell.sql
53. 054_lead_call_outcomes_daily_distribution.sql
54. 055_employee_master_performance_followups_projects.sql
55. 056_employee_contribution_slabs_visibility.sql
56. 057_voice_form_fields.sql
57. 058_village_opportunity_intelligence.sql
58. 059_universal_journey_context.sql
59. 060_supply_inventory_management.sql
60. 061_customer_family_otp_rate_limits.sql
61. 062_customer_family_otp_verification_attempts.sql

The older `db/migrations/` directory contains source migrations retained for compatibility. Do not run both trees against the same database unless you have verified the statements are idempotent and intentionally duplicated.

Migration runner:
- `npm run db:migrate` runs the canonical migrations in numeric order.
- It requires `DATABASE_URL` or `POSTGRES_URL` and records applied files in `ycm_schema_migrations`.
- It is intentionally not part of CI; run it explicitly against the intended production database.
- Optional `DATABASE_SSL=disable` can be used only when the database endpoint does not require TLS.

Production prerequisites:
- DATABASE_URL or POSTGRES_URL
- YCM_SESSION_SECRET (at least 32 characters)
- OTP provider configuration
- Payment provider configuration
- Provider API credentials must be stored in deployment secrets/secret manager, never in PostgreSQL service configuration.

Never store database credentials or provider secrets in source control.

Membership pricing rule: ₹99 standard Individual/Household = 1 year. Special Family review starts at ₹99 / 1-year base state; after High Management approval, Widow Household or Defense Family becomes ₹99 / 2 years. No defense/government source credentials or raw sensitive government documents are stored in the membership record.
