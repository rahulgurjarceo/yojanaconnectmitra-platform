export const FAMILY_REGISTRATION_PLAN = {
  name: 'Family Registration',
  amount: 99,
  currency: 'INR',
  validityYears: 2,
} as const;

export type FamilyStatus = 'pending_payment' | 'active' | 'expired' | 'suspended';
export type MemberRelation = 'primary' | 'spouse' | 'child' | 'parent' | 'other';
export type ConsentType = 'service_assistance' | 'document_processing' | 'communication' | 'data_sharing';
export type CaseStatus = 'new' | 'in_progress' | 'submitted' | 'tracking' | 'completed' | 'closed';

export interface FamilyMember {
  memberId: string;
  fullName: string;
  relation: MemberRelation;
  mobile?: string;
  email?: string;
  dob?: string;
  verified: boolean;
}

export interface FamilyConsent {
  consentId: string;
  memberId: string;
  type: ConsentType;
  granted: boolean;
  grantedAt?: string;
  version: string;
}

export interface FamilyDocument {
  documentId: string;
  memberId: string;
  documentType: string;
  status: 'pending' | 'verified' | 'rejected';
  storageRef?: string;
  uploadedAt?: string;
}

export interface FamilyCaseLink {
  caseId: string;
  memberId: string;
  caseCategoryId: number;
  caseCategoryName: string;
  subService?: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Family360 {
  familyId: string;
  plan: typeof FAMILY_REGISTRATION_PLAN.name;
  amount: typeof FAMILY_REGISTRATION_PLAN.amount;
  currency: typeof FAMILY_REGISTRATION_PLAN.currency;
  validityYears: typeof FAMILY_REGISTRATION_PLAN.validityYears;
  status: FamilyStatus;
  primaryMember: FamilyMember;
  members: FamilyMember[];
  consents: FamilyConsent[];
  documents: FamilyDocument[];
  cases: FamilyCaseLink[];
  createdAt: string;
  updatedAt: string;
}

export const FAMILY_360_LIFECYCLE = [
  'Family registration',
  'OTP verification',
  'Payment authorization',
  'Family activation',
  'Members',
  'Consent ledger',
  'Document vault',
  'Case / application links',
  'TAT and status tracking',
  'Outcome / CRI / CSAT',
] as const;

export function validateFamilyRegistrationPayload(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.replace(/\s+/g, '') : '';
  const country = typeof body.country === 'string' ? body.country.trim() : 'India';

  const errors: string[] = [];
  if (fullName.length < 2) errors.push('fullName is required');
  if (!/^\+?[0-9]{10,15}$/.test(mobile)) errors.push('mobile must be a valid phone number');
  if (!country) errors.push('country is required');

  return {
    valid: errors.length === 0,
    errors,
    data: { fullName, mobile, country },
  };
}

export function buildFamilyId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `YCM-FAM-${stamp}-${random}`;
}
