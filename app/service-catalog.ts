export type YCMService = {
  id: string;
  name: string;
  module: string;
  audience: string[];
  kind: "INFORMATION" | "ASSISTANCE" | "APPLICATION" | "REFERRAL";
  description?: string;
  officialSource?: string;
};

export const YCM_SERVICE_MODULES = [
  "Government & Welfare",
  "Agriculture & Farming",
  "Animal Husbandry & Fisheries",
  "Education & Scholarships",
  "Jobs & Career",
  "Digital Documents & Citizen Services",
  "Legal Mitra",
  "Loans & Finance",
  "Insurance",
  "Health & Wellness",
  "Business & MSME",
  "Tax & Compliance",
  "Labour & Social Security",
  "Property & Land",
  "Utility & Local Services",
  "Travel & Immigration",
  "Women, Child & Family",
  "Senior Citizen & Disability",
  "Skill Development",
  "Transport & Vehicle",
  "Rural Development",
  "Environment & Energy",
  "Consumer Services",
  "Digital & Technology",
] as const;

export const YCM_SERVICE_CATALOG: YCMService[] = [
  // Government & Welfare
  ...[
    "Scheme discovery & eligibility check","Jan Aadhaar assistance","Government scheme application assistance",
    "DBT / benefit status check","Pension scheme assistance","Social security scheme assistance","Ration / NFSA assistance",
    "One Nation One Ration Card assistance","Ayushman Bharat / health scheme assistance","Housing scheme assistance",
    "MGNREGA registration & job-card assistance","Rural development scheme assistance","Urban welfare scheme assistance",
    "Scholarship scheme discovery","Disability welfare scheme discovery","Women welfare scheme discovery",
    "Minority welfare scheme discovery","SC/ST/OBC welfare scheme discovery","Tribal welfare scheme discovery",
    "Grievance / public-service guidance","Jan Soochna information lookup","RTI information/application assistance",
    "Government notice / circular lookup","Scheme beneficiary status lookup","Scheme document checklist",
  ].map((name) => ({ id: slug(name), name, module: "Government & Welfare", audience: ["Citizen","Family"], kind: "ASSISTANCE" as const })),

  // Agriculture & Farming
  ...[
    "PM-KISAN registration / status assistance","Kisan Credit Card (KCC) assistance","Crop loan assistance",
    "Short-term crop loan assistance","Agriculture term loan assistance","PM Fasal Bima Yojana application",
    "Crop insurance premium calculation","Crop insurance policy/status check","Crop loss / insurance claim assistance",
    "Crop damage reporting guidance","PM-KUSUM solar agriculture assistance","Solar pump assistance",
    "Agricultural machinery / mechanisation subsidy assistance","Farm equipment subsidy discovery",
    "Seed subsidy / certified seed assistance","Fertilizer information & subsidy guidance","Soil Health Card assistance",
    "Soil testing service discovery","Crop advisory","Crop calendar","Crop planning","Irrigation assistance",
    "Drip / sprinkler irrigation subsidy discovery","Micro-irrigation assistance","Horticulture scheme assistance",
    "Organic farming assistance","Natural farming assistance","Protected cultivation / polyhouse assistance",
    "Greenhouse / shade-net assistance","Nursery / planting material assistance","Farm pond / water conservation assistance",
    "Agricultural land development assistance","Custom Hiring Centre discovery","Farm machinery rental discovery",
    "FPO formation assistance","FPO registration guidance","FPO business planning","Farmer Producer Company guidance",
    "Farmer group / SHG / JLG assistance","Agricultural marketing assistance","APMC / mandi information",
    "e-NAM guidance","MSP / procurement information","Government grain procurement assistance",
    "Warehouse / storage assistance","Cold storage discovery","Agri logistics assistance","Farm-gate selling support",
    "Commodity price information","Crop market comparison","Post-harvest management assistance",
    "Food processing / value addition assistance","Agri export information","Agricultural entrepreneurship assistance",
    "Agri startup / innovation scheme discovery","Dairy farming finance","Poultry farming finance",
    "Goat / sheep farming finance","Fisheries finance","Beekeeping / apiculture assistance",
    "Sericulture assistance","Mushroom farming assistance","Floriculture assistance","Medicinal plant farming assistance",
    "Farm accounting / cost calculator","Crop profitability calculator","Farm income planning",
    "Agricultural document checklist","Farmer grievance guidance",
  ].map((name) => ({ id: slug(name), name, module: "Agriculture & Farming", audience: ["Farmer","FPO","Rural Business"], kind: "ASSISTANCE" as const, officialSource: "https://www.myscheme.gov.in/" })),

  // Animal Husbandry & Fisheries
  ...[
    "Dairy farm registration / assistance","Dairy subsidy scheme discovery","Cattle purchase loan assistance",
    "Livestock insurance assistance","Animal vaccination information","Veterinary service discovery",
    "Animal health camp discovery","Breed improvement information","Cattle feed guidance","Fodder development assistance",
    "Goat farming assistance","Sheep farming assistance","Pig farming assistance","Poultry farm assistance",
    "Backyard poultry assistance","Duck farming assistance","Fisheries scheme assistance","Fish farming loan assistance",
    "Fish pond development assistance","Aquaculture assistance","Fisheries insurance information",
    "Beekeeping assistance","Honey processing assistance","Animal husbandry entrepreneurship assistance",
  ].map((name) => ({ id: slug(name), name, module: "Animal Husbandry & Fisheries", audience: ["Farmer","Rural Business"], kind: "ASSISTANCE" as const })),

  // Education
  ...[
    "School admission guidance","College admission guidance","University admission guidance","Course discovery",
    "Career counselling","Stream selection counselling","Subject selection guidance","LKG–12 education guidance",
    "Open schooling guidance","Distance education guidance","Online course discovery","Skill course discovery",
    "Scholarship eligibility check","National Scholarship Portal assistance","State scholarship assistance",
    "Pre-matric scholarship assistance","Post-matric scholarship assistance","Merit scholarship discovery",
    "Minority scholarship discovery","SC scholarship discovery","ST scholarship discovery","OBC scholarship discovery",
    "EWS education assistance","Scholarship renewal assistance","Fellowship discovery","Research fellowship guidance",
    "Education loan assistance","Student loan document checklist","Education loan subsidy discovery",
    "Entrance exam discovery","Entrance exam application assistance","Admit card / result guidance",
    "Competitive exam preparation resources","Government exam guidance","College comparison",
    "Course comparison","Institute verification guidance","UGC / AICTE recognition check guidance",
    "Internship discovery","Apprenticeship discovery","Study abroad guidance","International admission guidance",
    "Student visa guidance","Student document checklist","Hostel / accommodation discovery","Education fee planning",
    "Student certificate/document assistance","Academic document organisation","Marksheets / certificates guidance",
    "Digital learning resources","SWAYAM / online learning guidance","Vocational education guidance",
  ].map((name) => ({ id: slug(name), name, module: "Education & Scholarships", audience: ["Student","Parent"], kind: "ASSISTANCE" as const, officialSource: "https://www.education.gov.in/" })),

  // Jobs & Career
  ...[
    "Job search","Government job discovery","Private job discovery","Local job discovery","Work-from-home job discovery",
    "National Career Service guidance","Job profile creation","Resume / CV assistance","Cover letter assistance",
    "Job application assistance","Interview preparation","Career counselling","Career change guidance",
    "Apprenticeship discovery","Internship discovery","Skill-to-job matching","Employer discovery",
    "Placement assistance","Employment document checklist","Job verification guidance","Offer-letter review assistance",
    "Freelancing opportunity discovery","Gig work discovery","Overseas job information","Work-abroad document guidance",
    "e-Shram registration assistance","e-Shram profile update assistance","Unorganised worker scheme discovery",
    "Self-employment opportunity discovery",
  ].map((name) => ({ id: slug(name), name, module: "Jobs & Career", audience: ["Job Seeker","Worker","Student"], kind: "ASSISTANCE" as const })),

  // Documents & Citizen Services
  ...[
    "Aadhaar enrolment/update assistance","Aadhaar download assistance","Aadhaar status guidance","PAN application assistance",
    "PAN correction assistance","Instant e-PAN guidance","Voter ID registration assistance","Voter ID correction assistance",
    "Voter ID download guidance","Birth certificate assistance","Death certificate assistance","Marriage certificate assistance",
    "Caste certificate assistance","Income certificate assistance","Domicile / residence certificate assistance",
    "EWS certificate assistance","Disability certificate assistance","Character certificate guidance","Bonafide certificate guidance",
    "Family ID / family register assistance","Ration card assistance","Ration card correction","Driving licence assistance",
    "Learning licence assistance","Vehicle registration assistance","RC download guidance","Pollution certificate guidance",
    "Passport application assistance","Passport reissue assistance","Passport appointment assistance","PCC assistance",
    "DigiLocker assistance","Digital document storage","Document scan & OCR","Document verification checklist",
    "Document mismatch detection","Photo/signature preparation","Online form filling","Application tracking",
    "Appointment booking assistance","Government portal login assistance","Digital signature guidance","eSign guidance",
    "Grievance filing assistance","Application status tracking","Certificate download assistance","Document translation assistance",
  ].map((name) => ({ id: slug(name), name, module: "Digital Documents & Citizen Services", audience: ["Citizen","Family"], kind: "ASSISTANCE" as const })),

  // Legal Mitra
  ...[
    "Criminal law assistance","Cyber crime assistance","Civil dispute assistance","Property & land assistance",
    "Family & matrimonial assistance","Consumer dispute assistance","Labour law assistance","Business & corporate legal assistance",
    "Intellectual property assistance","Tax law assistance","Immigration legal assistance","Legal notice assistance",
    "Affidavit / declaration assistance","Agreement / contract drafting assistance","RTI legal-information assistance",
    "Free legal aid routing","Lawyer discovery & matching","Legal consultation appointment","Case intake",
    "Case document organisation","Evidence checklist","Legal source search","Case status workflow","Mediation / ADR routing",
  ].map((name) => ({ id: slug(name), name, module: "Legal Mitra", audience: ["Citizen","Business"], kind: "REFERRAL" as const })),

  // Loans & Finance
  ...[
    "Personal loan discovery","Home loan discovery","Education loan discovery","Vehicle loan discovery","Gold loan discovery",
    "Business loan discovery","MSME loan discovery","Working capital loan discovery","Equipment finance discovery",
    "Agriculture loan discovery","KCC loan discovery","Dairy loan discovery","Poultry loan discovery","Fisheries loan discovery",
    "Mudra loan guidance","PMEGP loan guidance","CGTMSE guidance","Credit-linked subsidy discovery",
    "Loan eligibility pre-check","Loan EMI calculator","Loan comparison","Loan document checklist","Loan application assistance",
    "Bank account opening guidance","Current account assistance","Savings account assistance","Jan Dhan account assistance",
    "Digital banking assistance","UPI assistance","Banking grievance guidance","Loan repayment planning",
    "Loan statement assistance","Credit report guidance","CIBIL dispute guidance","Financial literacy",
    "Savings planning","Budget planning","Small business finance planning",
  ].map((name) => ({ id: slug(name), name, module: "Loans & Finance", audience: ["Citizen","Farmer","Business"], kind: "REFERRAL" as const })),

  // Insurance
  ...[
    "Life insurance discovery","Term insurance discovery","Health insurance discovery","Family health insurance discovery",
    "Senior citizen health insurance discovery","Motor insurance discovery","Two-wheeler insurance discovery",
    "Commercial vehicle insurance discovery","Crop insurance discovery","Livestock insurance discovery","Travel insurance discovery",
    "Personal accident insurance discovery","Home insurance discovery","Business insurance discovery","Shop insurance discovery",
    "Property insurance discovery","Marine / cargo insurance information","Insurance premium comparison",
    "Insurance eligibility checklist","Policy document organisation","Policy renewal reminder","Insurance claim assistance",
    "Claim document checklist","Claim status assistance","Cashless hospital information","Insurance grievance routing",
    "Policy nomination guidance","Policy portability guidance","Insurance awareness",
  ].map((name) => ({ id: slug(name), name, module: "Insurance", audience: ["Citizen","Farmer","Business"], kind: "REFERRAL" as const, officialSource: "https://irdai.gov.in/" })),

  // Health
  ...[
    "Government health scheme discovery","Ayushman Bharat assistance","Hospital discovery","Diagnostic centre discovery",
    "Teleconsultation discovery","Doctor appointment assistance","Health insurance hospital search","Pharmacy discovery",
    "Medicine information lookup","Vaccination information","Maternal health scheme discovery","Child health scheme discovery",
    "Nutrition scheme discovery","Disability health support discovery","Mental-wellness information","Emergency service information",
    "Health document organisation","Medical report OCR / organisation","Health claim document assistance","Health grievance guidance",
  ].map((name) => ({ id: slug(name), name, module: "Health & Wellness", audience: ["Citizen","Family"], kind: "ASSISTANCE" as const })),

  // Business & MSME
  ...[
    "Business idea discovery","Business registration guidance","MSME/Udyam registration assistance","Startup registration guidance",
    "Company incorporation assistance","LLP registration guidance","Partnership registration guidance","Shop & establishment guidance",
    "Trade licence guidance","Food business licence guidance","FSSAI assistance","GST registration assistance",
    "Business PAN/TAN assistance","Current account assistance","Business loan assistance","PMEGP assistance",
    "Mudra assistance","CGTMSE guidance","MSME scheme discovery","Government tender discovery","Tender document assistance",
    "GeM seller guidance","Government procurement guidance","Trademark registration assistance","Copyright registration guidance",
    "IP protection guidance","Business agreement assistance","Vendor onboarding assistance","Invoice / billing setup guidance",
    "Business plan preparation","Project report assistance","DPR preparation assistance","Pitch deck assistance",
    "Startup funding discovery","Incubator discovery","Accelerator discovery","Export business guidance","Import-export setup guidance",
    "IEC assistance","Digital marketing assistance","Website / domain assistance","Business compliance calendar",
    "Franchise discovery","Franchise setup assistance","FPO / producer-company business assistance",
  ].map((name) => ({ id: slug(name), name, module: "Business & MSME", audience: ["Entrepreneur","Business","FPO"], kind: "ASSISTANCE" as const, officialSource: "https://msme.gov.in/" })),

  // Tax & Compliance
  ...[
    "Income tax registration guidance","ITR filing assistance","ITR form selection guidance","ITR-1 assistance","ITR-2 assistance",
    "ITR-3 assistance","ITR-4 assistance","ITR-5 assistance","ITR-6 assistance","ITR-7 assistance","Tax notice guidance",
    "Tax demand guidance","Tax refund status guidance","PAN verification","TAN services","AIS/TIS guidance","TDS/TCS guidance",
    "GST registration","GST return assistance","GST invoice guidance","GST notice assistance","GST refund guidance",
    "GST composition guidance","Business tax calendar","Basic bookkeeping assistance","Payroll compliance assistance",
    "PF/ESI compliance routing","Professional tax guidance","Business statutory compliance checklist",
  ].map((name) => ({ id: slug(name), name, module: "Tax & Compliance", audience: ["Citizen","Business","Professional"], kind: "ASSISTANCE" as const })),

  // Labour & Social Security
  ...[
    "e-Shram registration","e-Shram update","PM-SYM assistance","PM-JDY social-security guidance","PMJJBY guidance",
    "PMSBY guidance","EPF/UAN assistance","EPF balance / claim guidance","EPF nomination guidance","EPS/pension guidance",
    "ESIC assistance","ESIC card / benefit guidance","Gratuity information","Employee wage-rights information",
    "Workplace grievance routing","Maternity benefit information","Labour welfare scheme discovery","Worker registration assistance",
    "Construction worker welfare assistance","Street vendor scheme discovery","Social security eligibility check",
  ].map((name) => ({ id: slug(name), name, module: "Labour & Social Security", audience: ["Worker","Employer"], kind: "ASSISTANCE" as const })),

  // Property & Land
  ...[
    "Jamabandi / land-record lookup assistance","Girdawari information","Revenue map information","Mutation guidance",
    "Land registry guidance","Sale deed checklist","Gift deed checklist","Lease deed checklist","Rent agreement assistance",
    "Property document checklist","Land ownership document organisation","Boundary dispute referral","Encroachment grievance guidance",
    "Partition document assistance","Inheritance / succession document checklist","Will preparation referral","Property tax guidance",
    "Urban property services","Rural land services","Housing scheme discovery","Construction permission guidance",
  ].map((name) => ({ id: slug(name), name, module: "Property & Land", audience: ["Citizen","Farmer","Business"], kind: "ASSISTANCE" as const })),

  // Utility & Local
  ...[
    "Electricity connection assistance","Electricity bill payment guidance","Electricity complaint guidance","Water connection assistance",
    "Water bill guidance","Municipal service assistance","Property tax payment guidance","Sewerage service guidance",
    "Gas connection assistance","LPG subsidy information","Telecom grievance guidance","Internet service complaint guidance",
    "Panchayat service guidance","Municipality service guidance","e-Panchayat assistance","Local grievance assistance",
    "Sanitation scheme assistance","Waste-management service information","Public-utility complaint tracking",
  ].map((name) => ({ id: slug(name), name, module: "Utility & Local Services", audience: ["Citizen","Family"], kind: "ASSISTANCE" as const })),

  // Travel & Immigration
  ...[
    "Passport services","Tatkaal passport guidance","Passport reissue","Police clearance certificate","Visa information",
    "Work visa information","Student visa information","Business visa information","Family visa information",
    "Immigration document checklist","Foreign employment guidance","Overseas education guidance","Travel insurance discovery",
    "Emigration / worker guidance","Embassy / consular service discovery","OCI information","Citizenship information",
  ].map((name) => ({ id: slug(name), name, module: "Travel & Immigration", audience: ["Citizen","Student","Worker","Business"], kind: "ASSISTANCE" as const })),

  // Women, Child & Family
  ...[
    "Women welfare scheme discovery","Child welfare scheme discovery","Palanhar scheme information","Child scholarship discovery",
    "Girl-child education scheme discovery","Maternity benefit discovery","Nutrition programme discovery","Anganwadi service guidance",
    "Marriage registration guidance","Family document organisation","Child birth-document assistance","Child protection referral",
    "Domestic-violence support routing","Women legal-aid routing","Family counselling referral","Adoption information",
  ].map((name) => ({ id: slug(name), name, module: "Women, Child & Family", audience: ["Family","Women","Parent"], kind: "ASSISTANCE" as const })),

  // Senior & Disability
  ...[
    "Old-age pension assistance","Senior citizen welfare discovery","Senior citizen card guidance","Disability certificate assistance",
    "UDID assistance","Disability pension guidance","Assistive-device scheme discovery","Special education discovery",
    "Caregiver support information","Senior health scheme discovery","Accessible transport information","Disability legal-aid routing",
  ].map((name) => ({ id: slug(name), name, module: "Senior Citizen & Disability", audience: ["Senior Citizen","Person with Disability","Family"], kind: "ASSISTANCE" as const })),

  // Skill
  ...[
    "Skill India course discovery","PMKVY guidance","ITI course discovery","Polytechnic course discovery","Apprenticeship guidance",
    "RSETI training discovery","Entrepreneurship training","Digital literacy training","Computer course discovery",
    "Spoken English course discovery","Financial literacy training","Agri skill training","Women skill training",
    "Rural skill training","Certification course discovery","Recognition of Prior Learning guidance",
  ].map((name) => ({ id: slug(name), name, module: "Skill Development", audience: ["Student","Worker","Farmer","Entrepreneur"], kind: "ASSISTANCE" as const })),

  // Transport
  ...[
    "Driving licence","Learning licence","DL renewal","DL address correction","International driving permit guidance",
    "Vehicle registration","RC transfer","RC duplicate","Vehicle ownership transfer","Hypothecation removal guidance",
    "PUC information","Motor insurance discovery","Traffic challan lookup guidance","Road-tax information","FASTag assistance",
    "Commercial vehicle permit guidance","Transport grievance guidance",
  ].map((name) => ({ id: slug(name), name, module: "Transport & Vehicle", audience: ["Citizen","Business"], kind: "ASSISTANCE" as const })),

  // Rural Development
  ...[
    "MGNREGA job card","MGNREGA work demand guidance","MGNREGA payment/status guidance","Rural housing scheme discovery",
    "Village infrastructure scheme information","Self-help group formation guidance","Rural livelihood scheme discovery",
    "NRLM / SHG assistance","Panchayat development information","Rural entrepreneurship discovery","Community asset scheme information",
  ].map((name) => ({ id: slug(name), name, module: "Rural Development", audience: ["Rural Family","Farmer","SHG"], kind: "ASSISTANCE" as const })),

  // Environment & Energy
  ...[
    "Solar rooftop information","PM-KUSUM assistance","Solar pump assistance","Renewable-energy subsidy discovery",
    "Energy-efficiency information","Electric vehicle information","EV charging discovery","Waste-management scheme discovery",
    "Water conservation assistance","Rainwater harvesting information","Environmental compliance guidance","Pollution-control information",
  ].map((name) => ({ id: slug(name), name, module: "Environment & Energy", audience: ["Citizen","Farmer","Business"], kind: "ASSISTANCE" as const })),

  // Consumer
  ...[
    "Consumer complaint guidance","Product complaint assistance","Service complaint assistance","Refund dispute assistance",
    "Warranty complaint guidance","E-commerce complaint guidance","Banking complaint guidance","Insurance complaint guidance",
    "Telecom complaint guidance","Builder / real-estate consumer complaint","Travel complaint guidance","Consumer documentation checklist",
  ].map((name) => ({ id: slug(name), name, module: "Consumer Services", audience: ["Citizen","Family"], kind: "ASSISTANCE" as const })),

  // Digital & Technology
  ...[
    "Digital literacy","Smartphone assistance","Email setup assistance","Online account assistance","DigiLocker setup",
    "UMANG assistance","Digital payment assistance","UPI safety guidance","Cyber-safety awareness","Cyber-fraud reporting guidance",
    "Document OCR","Document authenticity checklist","Digital signature assistance","eSign assistance","Online appointment assistance",
    "WhatsApp service support","AI assistant guidance","Family digital profile setup",
  ].map((name) => ({ id: slug(name), name, module: "Digital & Technology", audience: ["Citizen","Family","Business"], kind: "ASSISTANCE" as const })),
];

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const YCM_SERVICE_STATS = {
  modules: YCM_SERVICE_MODULES.length,
  services: YCM_SERVICE_CATALOG.length,
  sourceNote: "Master service taxonomy; eligibility, fees and application routes must be verified against the relevant current official authority before production use.",
};

export function getServicesByModule(module: string) {
  return YCM_SERVICE_CATALOG.filter((service) => service.module === module);
}
