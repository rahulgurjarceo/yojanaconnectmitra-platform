export type FamilyRecord = {
  familyId: string;
  status: 'pending_payment' | 'active' | 'expired' | 'suspended';
  fullName: string;
  mobile: string;
  country: string;
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

export interface CustomerFamilyRepository {
  create(input: Omit<FamilyRecord, 'createdAt' | 'updatedAt'>): Promise<FamilyRecord>;
  findById(familyId: string): Promise<FamilyRecord | null>;
  updateStatus(familyId: string, status: FamilyRecord['status']): Promise<FamilyRecord | null>;
  getActivationState(familyId: string): Promise<FamilyActivationState>;
  createOtpChallenge(input: { challengeId: string; familyId?: string; mobile: string; provider: string; expiresAt: string }): Promise<void>;
  getOtpChallenge(challengeId: string): Promise<FamilyOtpChallenge | null>;
  markOtpChallengeVerified(challengeId: string): Promise<boolean>;
  createPayment(input: { paymentId: string; familyId: string; amountPaise: number; currency: 'INR'; provider: string; providerReference: string }): Promise<void>;
  getPaymentByProviderReference(providerReference: string): Promise<FamilyPayment | null>;
  markPaymentVerified(orderId: string, paymentId: string): Promise<boolean>;
}

export function getCustomerFamilyRepository(): CustomerFamilyRepository | null { return null; }
