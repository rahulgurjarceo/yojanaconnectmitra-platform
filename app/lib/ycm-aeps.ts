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
  | 'reversed';

export type YcmAepsRequest = {
  transactionId: string;
  partnerUserId: string;
  transactionType: YcmAepsTransactionType;
  amountPaise?: number;
  providerCode: string;
  metadata?: Record<string, unknown>;
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
  return state === 'success';
}

export function shouldReverseCommission(state: YcmAepsTransactionState) {
  return state === 'failed' || state === 'reversed';
}
