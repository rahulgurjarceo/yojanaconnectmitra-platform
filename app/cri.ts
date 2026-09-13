export type CriStatus = 'excellent' | 'attention' | 'at-risk';

export type CriInput = {
  tatTargetHours?: number;
  elapsedHours?: number;
  documentsComplete?: boolean;
  paymentComplete?: boolean;
  assigned?: boolean;
  applicationProgress?: number;
  customerVisits?: number;
  governmentOfficeVisits?: number;
  followUps?: number;
  reworkCount?: number;
  outcome?: 'pending' | 'success' | 'partial' | 'rejected';
  csat?: number;
};

export type CriResult = {
  score: number;
  status: CriStatus;
  factors: Record<string, number>;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function calculateCRI(input: CriInput): CriResult {
  const tat = input.tatTargetHours && input.elapsedHours != null
    ? clamp(100 - ((input.elapsedHours - input.tatTargetHours) / input.tatTargetHours) * 100)
    : 70;
  const docs = input.documentsComplete === false ? 20 : 100;
  const payment = input.paymentComplete === false ? 35 : 100;
  const assignment = input.assigned === false ? 20 : 100;
  const progress = clamp(input.applicationProgress ?? 50);
  const visits = clamp(100 - ((input.customerVisits ?? 0) + (input.governmentOfficeVisits ?? 0)) * 5);
  const followUp = clamp(100 - (input.followUps ?? 0) * 4);
  const rework = clamp(100 - (input.reworkCount ?? 0) * 20);
  const outcome = input.outcome === 'success' ? 100 : input.outcome === 'partial' ? 70 : input.outcome === 'rejected' ? 10 : 50;
  const csat = input.csat == null ? 70 : clamp(input.csat * 20);

  const score = Math.round(
    tat * .18 + docs * .10 + payment * .08 + assignment * .08 + progress * .18 +
    visits * .08 + followUp * .07 + rework * .08 + outcome * .08 + csat * .07
  );
  const safeScore = clamp(score);
  return {
    score: safeScore,
    status: safeScore >= 80 ? 'excellent' : safeScore >= 60 ? 'attention' : 'at-risk',
    factors: { tat, documents: docs, payment, assignment, progress, visits, followUp, rework, outcome, csat },
  };
}
