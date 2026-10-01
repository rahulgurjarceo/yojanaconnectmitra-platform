export type CaseScenario = {
  title: string;
  trigger: string;
  supportingFacts: string[];
  missingFacts: string[];
  evidenceToSeek: string[];
  opposingArgument: string;
  lawyerAction: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

export type LegalReasoningReport = {
  issueMap: string[];
  factualGaps: string[];
  evidencePlan: string[];
  behaviouralConsiderations: string[];
  alternativeScenarios: CaseScenario[];
  questionsForLawyer: string[];
  riskFlags: string[];
  humanReviewRequired: boolean;
};

export const LEGAL_REASONING_GUARDRAILS = [
  "Do not predict a judge, police officer, prosecutor, arbitrator or other decision-maker's future decision.",
  "Do not assign a win probability or guarantee an outcome.",
  "Do not infer a person's mental illness, personality disorder, guilt or credibility from behaviour alone.",
  "Use psychology to identify communication patterns, cognitive biases, conflict dynamics, witness-interview risks and missing facts—not to diagnose people.",
  "Every material legal proposition must be tied to an authoritative source and verified by a qualified lawyer before client/court use.",
  "High-stakes criminal, child-safety, domestic-violence, detention, limitation/deadline and urgent matters require human lawyer review.",
] as const;

export function buildCaseReasoningChecklist(input: {
  facts: string;
  category?: string;
  jurisdiction?: string;
}): LegalReasoningReport {
  const factualGaps = [
    "Exact timeline and sequence of events",
    "Who was present and what each person directly observed",
    "Documents, messages, call records, transaction records or other objective evidence",
    "What the opposing party says happened",
    "Relief/remedy actually sought by the client",
    "Applicable limitation/deadline and current procedural stage",
  ];

  return {
    issueMap: [
      input.category ? `Primary legal area: ${input.category}` : "Primary legal area needs confirmation",
      input.jurisdiction ? `Jurisdiction: ${input.jurisdiction}` : "Jurisdiction needs confirmation",
      "Separate proven facts, client allegations, assumptions and disputed facts",
      "Map each material fact to the legal element or procedural requirement it may support",
    ],
    factualGaps,
    evidencePlan: [
      "Build a dated chronology from original records",
      "Preserve original electronic evidence and metadata where legally appropriate",
      "Identify independent corroboration and contradictions",
      "Verify every important document against its original source",
    ],
    behaviouralConsiderations: [
      "Ask neutral, non-leading questions before suggesting an interpretation",
      "Record the client's account separately from the AI's interpretation",
      "Check for memory gaps, hindsight bias, confirmation bias and escalation dynamics",
      "Do not treat emotional presentation, confidence, hesitation or distress as proof of truth or falsity",
    ],
    alternativeScenarios: [
      {
        title: "Client account substantially supported",
        trigger: "Key facts are independently corroborated",
        supportingFacts: ["Timeline matches records", "Independent evidence supports material facts"],
        missingFacts: ["Any remaining disputed material fact"],
        evidenceToSeek: ["Primary records", "Independent witnesses", "Authenticated digital evidence"],
        opposingArgument: "The opposing side may dispute authenticity, interpretation, causation or intent.",
        lawyerAction: "Test each material fact against the governing law and primary evidence.",
        confidence: "MEDIUM",
      },
      {
        title: "Material factual dispute",
        trigger: "Both sides have materially different accounts",
        supportingFacts: ["Conflicting statements or records"],
        missingFacts: ["Independent corroboration and chronology"],
        evidenceToSeek: ["Contemporaneous records", "Neutral witnesses", "Original electronic records"],
        opposingArgument: "The dispute may turn on admissibility, credibility, burden of proof or procedural rules.",
        lawyerAction: "Identify the decisive disputed facts and evidence needed to resolve them.",
        confidence: "MEDIUM",
      },
    ],
    questionsForLawyer: [
      "What legal elements must actually be proved?",
      "Which facts are currently proved, merely alleged, or contradicted?",
      "What is the strongest opposing argument?",
      "What evidence could materially change the assessment?",
      "Are there limitation, jurisdiction, forum or procedural deadlines?",
      "What immediate protective or procedural step, if any, requires urgent review?",
    ],
    riskFlags: [
      "Insufficient facts",
      "Unverified legal authority",
      "Potentially conflicting evidence",
      "Potential deadline/limitation issue",
      "High-stakes matter requiring lawyer review",
    ],
    humanReviewRequired: true,
  };
}
