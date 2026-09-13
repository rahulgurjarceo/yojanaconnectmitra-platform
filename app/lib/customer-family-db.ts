export type FamilyRecord = {
  familyId: string;
  status: 'pending_payment' | 'active' | 'expired' | 'suspended';
  fullName: string;
  mobile: string;
  country: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyActivationState = {
  otpVerified: boolean;
  paymentVerified: boolean;
};

export interface CustomerFamilyRepository {
  create(input: Omit<FamilyRecord, 'createdAt' | 'updatedAt'>): Promise<FamilyRecord>;
  findById(familyId: string): Promise<FamilyRecord | null>;
  updateStatus(familyId: string, status: FamilyRecord['status']): Promise<FamilyRecord | null>;
  getActivationState(familyId: string): Promise<FamilyActivationState>;
  markOtpChallengeVerified(challengeId: string): Promise<boolean>;
  markPaymentVerified(orderId: string, paymentId: string): Promise<boolean>;
}

/** Production boundary: provide a Postgres/Supabase/Hostinger database implementation
 * through environment-backed configuration. Never persist customer data in source code.
 */
export function getCustomerFamilyRepository(): CustomerFamilyRepository | null {
  return null;
}
