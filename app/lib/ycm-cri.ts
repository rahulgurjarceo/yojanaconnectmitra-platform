export const CRI_DIMENSIONS = [
  'tat','documents','payment','employee','authority','officeVisits',
  'governmentVisits','followups','rework','progress','outcome','satisfaction'
] as const;
export type CriDimension = typeof CRI_DIMENSIONS[number];
export type CriInput = Record<CriDimension, number>;
export type CriBand = 'excellent' | 'attention_required' | 'at_risk';

export const CRI_WEIGHTS: Record<CriDimension, number> = {
  tat: 12, documents: 10, payment: 5, employee: 8, authority: 10,
  officeVisits: 5, governmentVisits: 8, followups: 7, rework: 8,
  progress: 10, outcome: 10, satisfaction: 7
};

export function calculateCri(input: CriInput) {
  const score = Math.round(CRI_DIMENSIONS.reduce((sum, key) => sum + Math.max(0, Math.min(100, Number(input[key]) || 0)) * CRI_WEIGHTS[key], 0) / 100);
  const band: CriBand = score >= 85 ? 'excellent' : score >= 60 ? 'attention_required' : 'at_risk';
  return { score, band };
}
