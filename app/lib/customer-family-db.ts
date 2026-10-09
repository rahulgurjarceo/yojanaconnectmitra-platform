export type FamilyRecord = {
  familyId: string;
  status: 'pending_payment' | 'active' | 'expired' | 'suspended';
  fullName: string;
  mobile: string;
  country: string;
  stateCode?: string;
  districtCode?: string;
  blockCode?: string;
  gramPanchayatCode?: string;
  villageCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyActivationState = { otpVerified: boolean; paymentVerified: boolean };
export type FamilyOtpChallenge = {
  familyId: string | null;
  mobile: string;
  status: 'created' | 'sent' | 'verified' | 'expired' | 'failed';
  expiresAt: string;
};

export type FamilyPayment = {
  paymentId: string;
  familyId: string;
  amountPaise: number;
  currency: 'INR';
  provider: string;
  providerReference: string | null;
  status: 'created' | 'pending' | 'success' | 'failed' | 'refunded';
  signatureVerified: boolean;
};

import { getPostgresCustomerFamilyRepository } from './customer-family-postgres';

export function getCustomerFamilyRepository() {
  return getPostgresCustomerFamilyRepository();
}

export interface CustomerFamilyRepository {
  create(input: Omit<FamilyRecord, 'createdAt' | 'updatedAt'>): Promise<FamilyRecord>;
  findById(familyId: string): Promise<FamilyRecord | null>;
  updateStatus(familyId: string, status: FamilyRecord['status']): Promise<FamilyRecord | null>;
  getActivationState(familyId: string): Promise<FamilyActivationState>;
  reserveOtpSend(mobile: string): Promise<boolean>;
  createOtpChallenge(input: { challengeId: string; familyId?: string; mobile: string; provider: string; expiresAt: string }): Promise<void>;
  getOtpChallenge(challengeId: string): Promise<FamilyOtpChallenge | null>;
  markOtpChallengeVerified(challengeId: string): Promise<boolean>;
  createPayment(input: { paymentId: string; familyId: string; amountPaise: number; currency: 'INR'; provider: string; providerReference: string }): Promise<void>;
  getPaymentByProviderReference(providerReference: string): Promise<FamilyPayment | null>;
  markPaymentVerified(orderId: string, paymentId: string): Promise<boolean>;
  createMember(input: { memberId: string; familyId: string; fullName: string; relation: string; mobile?: string; email?: string; dateOfBirth?: string }): Promise<void>;
  createConsent(input: { consentId: string; familyId: string; memberId?: string; consentType: string; granted: boolean; policyVersion: string }): Promise<void>;
  createDocument(input: { documentId: string; familyId: string; memberId?: string; documentType: string; storageRef?: string }): Promise<void>;
  createCase(input: { caseId: string; familyId: string; memberId?: string; caseCategoryId: string; caseCategoryName: string; subService?: string; applicationId?: string }): Promise<void>;
  updateCase(input: { caseId: string; familyId: string; status?: string; priority?: string; dueAt?: string; assignedTo?: string; escalated?: boolean; outcomeCode?: string; outcomeNotes?: string; csatScore?: number; csatComment?: string }): Promise<void>;
}
