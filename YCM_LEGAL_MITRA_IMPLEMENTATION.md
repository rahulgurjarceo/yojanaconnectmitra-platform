# YCM One — Legal Mitra Implementation

## Current vertical
- Route: /legal-mitra
- Voice/text intake
- Client profile: name, mobile, WhatsApp, email, address
- Country + jurisdiction
- Client role
- Legal category/subcategory
- Incident date/place
- Case narrative
- Urgent flag
- Legal-aid flag
- Case ID generation API: /api/legal-intake

## Production work still required
1. Persist case + client data in the existing YCM database/CRM.
2. Add encrypted object storage for voice recordings and evidence.
3. Add speech-to-text provider fallback for mobile browsers.
4. Add jurisdiction-aware retrieval from official legal sources.
5. Add versioned legal documents: country, jurisdiction, source URL, effective_from, effective_to, last_verified_at.
6. Add AI retrieval/citation layer; never use an unverified section number as a final answer.
7. Add lawyer directory + enrollment/verification workflow.
8. Add legal-aid routing (India: NALSA/SLSA/DLSA/TLSC; other countries: local authority).
9. Add payment order creation + webhook verification; credentials must remain server-side.
10. Add invoices, refunds, appointment scheduling and case status notifications.
11. Add consent, privacy, retention and access-audit controls for sensitive case data.
12. Add human review gates for professional legal advice/representation.

## Core case states
NEW -> INTAKE -> CLIENT_CONFIRMED -> CLASSIFIED -> DOCUMENTS_PENDING ->
LAWYER_MATCHING / LEGAL_AID_REVIEW -> PAYMENT_PENDING -> ASSIGNED ->
IN_PROGRESS -> RESOLVED / CLOSED

## Suggested database entities
legal_clients
legal_cases
legal_case_parties
legal_case_events
legal_case_documents
legal_case_voice
legal_categories
legal_subcategories
legal_jurisdictions
legal_sources
legal_source_versions
legal_forms
legal_lawyers
legal_lawyer_verifications
legal_assignments
legal_appointments
legal_payments
legal_aid_requests
legal_ai_sessions
legal_ai_messages
legal_audit_logs

## Payment
Use a server-side payment provider adapter:
createOrder -> redirect/checkout -> webhook -> verify signature -> mark PAID -> issue receipt.
Do not put secret payment keys in client code.

## Official-source baseline
India Code provides searchable Acts, Sections, subordinate legislation, Rules, Regulations, Notifications, Orders, Ordinances, Statutes and Circulars.
NALSA/State Legal Services Authorities provide legal-aid routes and eligibility information.

This document is an implementation baseline, not legal advice.
