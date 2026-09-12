import { FAMILY_REGISTRATION_PLAN, type Family360, type FamilyMember } from './customer-family';

export type AdapterState = 'not_configured' | 'configured' | 'verified';

export interface FamilyStorageAdapter {
  state: AdapterState;
  createFamily(input: { familyId: string; primaryMember: FamilyMember; status: Family360['status'] }): Promise<Family360>;
  getFamily(familyId: string): Promise<Family360 | null>;
  updateFamily(familyId: string, patch: Partial<Family360>): Promise<Family360>;
}

export interface OtpAdapter {
  state: AdapterState;
  requestOtp(mobile: string): Promise<{ requestId: string; expiresInSeconds: number }>;
  verifyOtp(requestId: string, otp: string): Promise<{ verified: boolean; memberId?: string }>;
}

export interface PaymentAdapter {
  state: AdapterState;
  createOrder(input: { familyId: string; amount: number; currency: string }): Promise<{ orderId: string; checkoutUrl?: string }>;
  verifyWebhook(input: unknown): Promise<{ verified: boolean; orderId?: string; paymentId?: string }>;
}

export const PRODUCTION_ADAPTER_STATUS = {
  storage: 'not_configured' as AdapterState,
  otp: 'not_configured' as AdapterState,
  payment: 'not_configured' as AdapterState,
};

export const FAMILY_PRODUCTION_REQUIREMENTS = {
  plan: FAMILY_REGISTRATION_PLAN,
  requiredAdapters: ['database', 'otp', 'payment-gateway'],
  activationRule: 'OTP verified + payment verified + family persisted',
  security: ['Do not store raw Aadhaar', 'Consent before service processing', 'Audit every activation/payment/consent change'],
} as const;
