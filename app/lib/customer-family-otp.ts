export type OtpChallenge = {
  challengeId: string;
  mobile: string;
  expiresAt: string;
};

export interface CustomerFamilyOtpProvider {
  sendOtp(mobile: string, purpose: 'family_registration' | 'login'): Promise<OtpChallenge>;
  verifyOtp(challengeId: string, otp: string): Promise<{ verified: boolean }>;
}

/** Production boundary. Configure a compliant SMS/OTP provider server-side. */
export function getCustomerFamilyOtpProvider(): CustomerFamilyOtpProvider | null {
  return null;
}
