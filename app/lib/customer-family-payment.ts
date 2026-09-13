export type PaymentOrder = {
  orderId: string;
  amount: number;
  currency: 'INR';
  status: 'created';
};

export interface CustomerFamilyPaymentProvider {
  createOrder(input: { familyId: string; amount: number; currency: 'INR' }): Promise<PaymentOrder>;
  verifyPayment(input: { orderId: string; paymentId: string; signature: string }): Promise<{ verified: boolean }>;
}

/** Production boundary. Configure a real payment gateway server-side; never expose secrets to the browser. */
export function getCustomerFamilyPaymentProvider(): CustomerFamilyPaymentProvider | null {
  return null;
}
