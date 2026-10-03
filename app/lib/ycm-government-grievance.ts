export type GovernmentJurisdictionLevel =
  | 'india' | 'state' | 'division' | 'district' | 'sub_district' | 'block' | 'gram_panchayat' | 'village' | 'ward';

export type GovernmentAllegationType =
  | 'service_issue' | 'delay' | 'refusal' | 'document_issue' | 'misconduct' | 'bribery_report' | 'other';

export const GOVERNMENT_GRIEVANCE_CATEGORIES = [
  'service_delay','service_refusal','document_certificate','education','health','water','electricity',
  'ration_food','agriculture','police_public_safety','municipal_local_body','revenue_land',
  'social_welfare','corruption_bribery','other',
] as const;

export const GOVERNMENT_GRIEVANCE_SAFETY_RULES = {
  officialOnly: true,
  allegationDisclaimer: 'YCM records and routes a citizen report; it does not determine whether an allegation is true.',
  piiMinimization: true,
  sourceRequiredForPublishedContacts: true,
} as const;

export function normalizeGrievanceText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v && v.length <= max ? v : null;
}
