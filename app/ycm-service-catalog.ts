import { CASE_UNIVERSE } from './case-universe';

export type YcmServiceMode = 'discovery' | 'assistance' | 'execution' | 'referral' | 'tracking';

export type YcmService = {
  id: string;
  domainId: string;
  domain: string;
  name: string;
  mode: YcmServiceMode;
  requiresConsent: boolean;
};

// Canonical service layer derived from all 35 master Case Universe domains.
export const YCM_SERVICE_CATALOG: YcmService[] = CASE_UNIVERSE.map(domain => ({
  id: `${domain.id}-core`,
  domainId: domain.id,
  domain: domain.name,
  name: domain.description,
  mode: 'assistance',
  requiresConsent: true,
}));

// Cross-cutting capabilities intentionally span the 35 domains rather than
// becoming duplicate case domains: APS/public services, legal, finance,
// governance, farmers, education/placement, welfare and international support.
export const YCM_CROSS_CUTTING_CAPABILITIES = [
  { id: 'aps-public-services', name: 'APS / Public Service Assistance', domains: ['government-services-schemes','documents-certificates','digital-services','municipal-local-body','utility-services'] },
  { id: 'legal', name: 'Legal & Authorized Professional Routing', domains: ['legal-documentation','court-authority-process','property-land','professional-services'] },
  { id: 'financial', name: 'Financial Services & Finance Assistance', domains: ['loans-finance-insurance','tax-gst-accounting','banking-financial-services','business-startup-msme','pension'] },
  { id: 'governance', name: 'Governance, Compliance & Audit', domains: ['government-services-schemes','business-startup-msme','tax-gst-accounting','corporate-business-services','municipal-local-body'] },
  { id: 'farmers', name: 'Farmers & Agriculture Services', domains: ['agriculture-farmer','loans-finance-insurance','food-nutrition'] },
  { id: 'education', name: 'Education, Internship & Placement', domains: ['education-admission-scholarship','jobs-employment-internship','skills-vocational-training','overseas-education-employment'] },
  { id: 'family-welfare', name: 'Family, Welfare & Social Support', domains: ['women-children-senior','disability-social-welfare','food-nutrition','pension','ngo-social-assistance'] },
  { id: 'international', name: 'International Citizen Services', domains: ['travel-passport-visa-immigration','overseas-education-employment','international-citizen-resident'] },
] as const;

export const YCM_SERVICE_DOMAIN_COUNT = CASE_UNIVERSE.length;
export const YCM_SERVICE_CORE_COUNT = YCM_SERVICE_CATALOG.length;

export function getServicesForDomain(domainId: string): YcmService[] {
  return YCM_SERVICE_CATALOG.filter(service => service.domainId === domainId);
}
