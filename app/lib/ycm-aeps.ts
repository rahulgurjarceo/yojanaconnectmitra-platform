export type YcmAepsTransactionType =
  | 'cash_withdrawal'
  | 'cash_deposit'
  | 'balance_enquiry'
  | 'mini_statement'
  | 'aadhaar_to_aadhaar_transfer';

export type YcmAepsTransactionState =
  | 'initiated'
  | 'provider_processing'
  | 'success'
  | 'failed'
  | 'reversed'
  | 'reconciled';

export type YcmAepsRequest = {
  transactionId: string;
  partnerUserId: string;
  transactionType: YcmAepsTransactionType;
  amountPaise?: number;
  providerCode: string;
  metadata?: Record<string, unknown>;
  /** Provider-specific AEPS payload fields; required by EKO when used. */
  aadhaarEncrypted?: string;
  pidData?: string;
  bankCode?: string;
  customerMobile?: string;
  latLong?: string;
  sourceIp?: string;
  notifyCustomer?: 0 | 1;
};

export type YcmAepsResult = {
  providerReference?: string;
  state: YcmAepsTransactionState;
  message?: string;
  metadata?: Record<string, unknown>;
};

export interface YcmAepsProvider {
  initiate(request: YcmAepsRequest): Promise<YcmAepsResult>;
  status(transactionId: string): Promise<YcmAepsResult>;
}

export function assertAepsAmount(amountPaise: number | undefined) {
  if (amountPaise === undefined) return;
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error('AEPS_AMOUNT_INVALID');
  }
}

export function canCreditCommission(state: YcmAepsTransactionState) {
  return state === 'success' || state === 'reconciled';
}

export function shouldReverseCommission(state: YcmAepsTransactionState) {
  return state === 'failed' || state === 'reversed';
}
