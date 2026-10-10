export type YcmImpactOutcomeType =
  | 'education_enrollment'
  | 'education_improvement'
  | 'scholarship_access'
  | 'employment'
  | 'skill_completion'
  | 'government_service_access'
  | 'document_completion'
  | 'financial_inclusion'
  | 'agriculture_outcome'
  | 'health_welfare_referral';

export type YcmEvidenceType =
  | 'baseline_assessment'
  | 'followup_assessment'
  | 'official_document'
  | 'institution_confirmation'
  | 'application_receipt'
  | 'benefit_confirmation'
  | 'employment_confirmation'
  | 'user_consent'
  | 'field_visit'
  | 'third_party_verification';

export type YcmImpactRecord = {
  impactId: string;
  familyId?: string | null;
  memberId?: string | null;
  caseId?: string | null;
  blockCode: string;
  districtCode: string;
  stateCode: string;
  outcomeType: YcmImpactOutcomeType;
  baselineValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  baselineDate?: string | null;
  outcomeDate?: string | null;
  verified: boolean;
  verificationMethod?: YcmEvidenceType | null;
  evidenceRefs: string[];
  consentCaptured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type YcmBlockImpactSummary = {
  blockCode: string;
  districtCode: string;
  stateCode: string;
  familiesServed: number;
  casesCompleted: number;
  outcomesVerified: number;
  educationEnrollments: number;
  educationImprovements: number;
  scholarshipAccesses: number;
  employmentOutcomes: number;
  skillCompletions: number;
  governmentServicesCompleted: number;
  documentCompletions: number;
  financialInclusionOutcomes: number;
  agricultureOutcomes: number;
};

export type YcmImpactEvidencePacket = {
  packetId: string;
  generatedAt: string;
  periodFrom: string;
  periodTo: string;
  geography: {
    stateCode?: string;
    districtCode?: string;
    blockCode?: string;
  };
  methodologyVersion: string;
  summary: YcmBlockImpactSummary;
  methodology: string[];
  evidenceCount: number;
  verifiedEvidenceCount: number;
  consentedRecordsOnly: boolean;
  generatedBy: string;
};
