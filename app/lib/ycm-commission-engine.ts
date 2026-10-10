export type YcmCommissionRule = {
  serviceId: string;
  partnerPercent: number;
  referralPercent: number;
  ycmPercent: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
};

export type YcmCommissionSplit = {
  grossAmountPaise: number;
  partnerPaise: number;
  referralPaise: number;
  ycmPaise: number;
};

export function validateCommissionRule(rule: Pick<YcmCommissionRule, 'partnerPercent'|'referralPercent'|'ycmPercent'>) {
  const values = [rule.partnerPercent, rule.referralPercent, rule.ycmPercent];
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error('COMMISSION_PERCENT_INVALID');
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.000001) {
    throw new Error('COMMISSION_PERCENT_TOTAL_MUST_EQUAL_100');
  }
}

export function calculateCommissionSplit(grossAmountPaise: number, rule: Pick<YcmCommissionRule, 'partnerPercent'|'referralPercent'|'ycmPercent'>): YcmCommissionSplit {
  if (!Number.isInteger(grossAmountPaise) || grossAmountPaise < 0) {
    throw new Error('GROSS_AMOUNT_INVALID');
  }
  validateCommissionRule(rule);

  const partnerPaise = Math.floor(grossAmountPaise * rule.partnerPercent / 100);
  const referralPaise = Math.floor(grossAmountPaise * rule.referralPercent / 100);
  const ycmPaise = grossAmountPaise - partnerPaise - referralPaise;

  return { grossAmountPaise, partnerPaise, referralPaise, ycmPaise };
}

export type YcmTransactionState =
  | 'initiated'
  | 'provider_processing'
  | 'success'
  | 'failed'
  | 'reversed'
  | 'reconciled';

export function isCommissionableState(state: YcmTransactionState) {
  return state === 'success' || state === 'reconciled';
}

export function isCommissionReversibleState(state: YcmTransactionState) {
  return state === 'failed' || state === 'reversed';
}
