export type EducationPath = {
  step: number;
  key: "UNIVERSITY" | "PROGRAMME" | "MODE" | "SESSION" | "ELIGIBILITY" | "SCHOLARSHIP" | "ADMISSION";
  title: string;
  status: "READY" | "VERIFY_LIVE" | "NEXT";
};

export const EDUCATION_ADMISSION_FLOW: EducationPath[] = [
  { step: 1, key: "UNIVERSITY", title: "Find university", status: "READY" },
  { step: 2, key: "PROGRAMME", title: "Choose programme/course", status: "NEXT" },
  { step: 3, key: "MODE", title: "Regular / Online / ODL", status: "VERIFY_LIVE" },
  { step: 4, key: "SESSION", title: "Check current academic session", status: "VERIFY_LIVE" },
  { step: 5, key: "ELIGIBILITY", title: "Check eligibility", status: "NEXT" },
  { step: 6, key: "SCHOLARSHIP", title: "Find scholarship / finance", status: "NEXT" },
  { step: 7, key: "ADMISSION", title: "Open official admission route", status: "NEXT" },
];
