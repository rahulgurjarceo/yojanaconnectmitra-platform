# YCM ONE — All-in-One Organisation & Platform Blueprint

## 1. Product
YCM ONE is the single operating platform for Yojana Connect Mitra Pvt Ltd.
It serves Head Office employees, state/district/block operations, centres, Mitras, franchisees, professional partners, colleges, training partners and customers.

## 2. Core hierarchy
CEO / Board
-> COO / CTO / CFO / Compliance / HR / Business
-> National Operations
-> State
-> Region
-> District
-> Block
-> Cluster
-> Centre
-> Mitra
-> Customer / Family

## 3. User types
- CEO / Board
- Head Office employee
- State Head
- Regional Head
- District Head
- Block Coordinator
- Cluster Coordinator
- Centre Manager
- Mitra
- Franchise / Centre Partner
- CA / CS / Professional Partner
- College / University Partner
- Training Partner / Training Centre
- Corporate / Bank / NBFC / Insurance Partner
- Customer / Family

## 4. Platform modules
1. Identity, login, RBAC and security
2. CEO Command Center
3. Employee / HR
4. Organisation & geographic hierarchy
5. Customer / Family 360
6. Documents, OCR and compliance/KYC
7. Need / AI Mitra / Human Mitra / Voice / WhatsApp
8. Service Master and 35 service domains
9. Service applications / cases / TAT / escalation / dispatch
10. CRM, leads and customer communication
11. Partner / franchise / Mitra management
12. College / education / scholarship / admission
13. Skill / TP / training / placement
14. CA / CS / legal professional network
15. Finance / loans / insurance / AEPS / payment
16. Commission and settlement engine
17. Agri / farmer / FPO operations
18. Finance, expenses, assets and reconciliation
19. Tickets / grievance / support
20. Impact & Proof / CRI
21. Reports, analytics and audit
22. Notifications and workflow automation

## 5. Role-scoped dashboards
CEO: all-India command centre, KPIs, revenue, cases, risks, impact and approvals.
State: state-only operational scope.
District: district-only scope.
Block: block-only scope.
Centre: centre/customer/application scope.
Mitra: assigned customers, tasks, cases, documents and commission.
Partner: own organisation, referrals, applications and settlements.
Customer: own family, documents, services, applications, payments and support.

## 6. Core entities
User, Employee, Role, Permission, OrganisationUnit, Geography, Centre, Mitra, Partner, Customer, Family, FamilyMember, Consent, Document, DocumentRequirement, ServiceDomain, Service, ServiceProvider, ServiceApplication, Case, Task, Dispatch, Lead, Ticket, CommissionRule, CommissionEntry, Wallet/Ledger, Payment, Settlement, College, Student, TrainingPartner, TrainingCentre, Professional, Farmer, FPO, Notification, AuditLog, ComplianceRequirement.

## 7. Operating rules
- Do not duplicate existing YCM ONE modules.
- Treat code built, tested, production connected and pending as separate states.
- Every sensitive operation is RBAC/geo scoped and audit logged.
- Service-specific document validity and recurring KYC deadlines must drive reminders/tasks.
- Commission must be calculated from governed Service Master rules.
- Partner/professional activities must respect applicable authorisation and professional regulations.
- Government services must use only authorised portals/integrations/partnerships.
- Customer data is visible only according to role, consent and geographic/business scope.

## 8. Implementation priority
P0: identity/RBAC/security, organisation geography, employee/partner/Mitra roles, Customer/Family 360, service application/case, service master, CEO dashboard.
P1: documents/OCR/compliance, dispatch/TAT, CRM, commission/ledger, payments, partner portals.
P2: education/college, TP/skill, professional network, finance marketplace, agri, WhatsApp/voice/AI automation.
P3: advanced analytics, impact/proof, national-scale automation and integrations.

## 9. Existing repository alignment
Repository: rahulgurjarceo/yojanaconnectmitra-platform
Working branch: feat/ycm-one-service-master-foundation
Existing foundations include employee, family, education, farmer, lawyer/legal, command centre, compliance, service master, services, workspace, login/register and API areas. This blueprint extends those foundations rather than creating a parallel application.

## 10. Definition of done
A module is only marked complete when:
1. code is built,
2. automated tests pass,
3. security/RBAC tests pass,
4. production configuration/integration is verified where applicable,
5. UI flow is verified,
6. operational owner and workflow are defined.
