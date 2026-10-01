export type LegalSource = {
  id: string;
  title: string;
  publisher: string;
  edition: string;
  date: string;
  jurisdiction: string;
  documentType: string;
  scope: string[];
  pages: { section: string; page: number }[];
  warning: string;
};

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: "bns-delhi-police-academy-2024-v2",
    title: "भारतीय न्याय संहिता (BNS) पुस्तिका",
    publisher: "दिल्ली पुलिस अकादमी",
    edition: "संस्करण-2",
    date: "मई 2024",
    jurisdiction: "India",
    documentType: "Training/reference booklet",
    scope: [
      "BNS 2023 overview",
      "IPC to BNS section mapping",
      "New and partially added BNS provisions",
      "Removed IPC provisions",
      "Selected BNSS provisions",
      "Punishment-duration indexes",
      "Commonly used policing sections"
    ],
    pages: [
      { section: "BNS general overview", page: 10 },
      { section: "IPC to BNS section index", page: 16 },
      { section: "New/partially added provisions", page: 80 },
      { section: "IPC provisions removed", page: 113 },
      { section: "Selected BNSS provisions", page: 114 },
      { section: "3 years or more and below 7 years punishment index", page: 128 },
      { section: "7 years or more punishment index", page: 175 },
      { section: "Commonly used policing sections", page: 209 }
    ],
    warning: "This 2024 training booklet is a reference source, not a substitute for checking the current authoritative text of the applicable law."
  }
];
