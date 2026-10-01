export type LawyerEngagement = "FULL_TIME" | "PART_TIME" | "COMMISSION" | "REFERRAL";

export type CommissionBreakdown = {
  grossAmount: number;
  lawyerPercent: number;
  ycmPercent: number;
  referralPercent: number;
  lawyerAmount: number;
  ycmAmount: number;
  referralAmount: number;
};

export const LEGAL_COMMISSION_RULES: Record<LawyerEngagement, { lawyerPercent:number; ycmPercent:number; referralPercent:number; label:string }> = {
  FULL_TIME: { lawyerPercent: 60, ycmPercent: 40, referralPercent: 0, label: "Full-Time Lawyer" },
  PART_TIME: { lawyerPercent: 45, ycmPercent: 55, referralPercent: 0, label: "Part-Time Lawyer" },
  COMMISSION: { lawyerPercent: 45, ycmPercent: 55, referralPercent: 0, label: "Commission / Independent Lawyer" },
  REFERRAL: { lawyerPercent: 40, ycmPercent: 55, referralPercent: 5, label: "Referral Lead" },
};

export function calculateLegalCommission(amount:number, engagement:LawyerEngagement, referralEligible = false): CommissionBreakdown {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero.");
  const rule = LEGAL_COMMISSION_RULES[engagement];
  const referralPercent = referralEligible ? rule.referralPercent : 0;
  const referralAmount = Math.round(amount * referralPercent) / 100;
  const lawyerAmount = Math.round(amount * rule.lawyerPercent) / 100;
  const ycmAmount = Math.round((amount - referralAmount - lawyerAmount) * 100) / 100;
  return { grossAmount: amount, lawyerPercent: rule.lawyerPercent, ycmPercent: rule.ycmPercent, referralPercent, lawyerAmount, ycmAmount, referralAmount };
}
