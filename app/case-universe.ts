export type CaseDomain = {
  id: string;
  name: string;
  icon: string;
  scope: 'India + International';
  pillar: string;
  description: string;
};

export const CASE_UNIVERSE: CaseDomain[] = [
  ['government-services-schemes','Government Services & Schemes','🏛️','Public Platform','Government services, schemes, benefits and citizen pathways.'],
  ['documents-certificates','Documents & Certificates','📄','Customer + Family 360','Certificates, identity documents, corrections, renewals and verification.'],
  ['education-admission-scholarship','Education / Admission / Scholarship','🎓','Public Platform','LKG to PhD admissions, scholarships, courses and education support.'],
  ['jobs-employment-internship','Jobs / Employment / Internship','💼','Service + Opportunity Intelligence','Government/private jobs, internships, recruitment and placement pathways.'],
  ['business-startup-msme','Business / Startup / MSME','🚀','Business Network','Startup, MSME, registrations, funding, compliance and growth support.'],
  ['loans-finance-insurance','Loans / Finance / Insurance','💳','Service + Opportunity Intelligence','Loan discovery, finance pathways, insurance and related assistance.'],
  ['tax-gst-accounting','Tax / GST / Accounting Assistance','🧾','Execution Engine','Tax, GST, ITR, accounting and compliance assistance with professional routing where required.'],
  ['legal-documentation','Legal / Documentation Assistance','⚖️','Universal Assistance','Legal-document preparation and routing to authorized professionals where required.'],
  ['property-land','Property / Land Related Assistance','🏠','Execution Engine','Property, land records, registration and related service pathways.'],
  ['court-authority-process','Court / Authority Process Assistance','🏛️','Universal Assistance','Process guidance and authorized professional routing for court/authority matters.'],
  ['health-medical-discovery','Health & Medical Service Discovery','🏥','Universal Assistance','Discovery of healthcare providers, services and verified health pathways.'],
  ['travel-passport-visa-immigration','Travel / Passport / Visa / Immigration','✈️','Public Platform','Passport, travel, visa and immigration service discovery and process support.'],
  ['overseas-education-employment','Overseas Education & Employment','🌍','Service + Opportunity Intelligence','International education, employment and relocation pathways.'],
  ['women-children-senior','Women / Children / Senior Citizen Services','👨‍👩‍👧','Universal Assistance','Age- and family-specific schemes, services and support.'],
  ['disability-social-welfare','Disability / Social Welfare','♿','Universal Assistance','Disability benefits, welfare schemes and accessibility-focused services.'],
  ['agriculture-farmer','Agriculture / Farmer Services','🌾','Service + Opportunity Intelligence','Farmer schemes, agriculture services, subsidies, markets and support.'],
  ['labour-worker','Labour / Worker Services','👷','Service + Opportunity Intelligence','Worker registration, labour services, welfare and employment pathways.'],
  ['pension','Pension','🧓','Service + Opportunity Intelligence','Pension discovery, applications, status and related support.'],
  ['banking-financial-services','Banking / Financial-Service Assistance','🏦','Service + Opportunity Intelligence','Banking and regulated financial-service discovery and routing.'],
  ['digital-services','Digital Services','📱','Public Platform','Digital citizen services, online forms, accounts and assisted access.'],
  ['utility-services','Utility Services','💡','Public Platform','Electricity, water, gas, telecom and other utility service assistance.'],
  ['consumer-grievances','Consumer Complaints / Grievances','🛒','Universal Assistance','Consumer complaints, escalation and grievance tracking.'],
  ['police-public-grievance','Police / Public Grievance Routing','🚔','Universal Assistance','Public grievance and police-service routing with safety-aware escalation.'],
  ['municipal-local-body','Local-Body / Municipal Services','🏙️','Public Platform','Municipal, panchayat and local-body services and applications.'],
  ['ngo-social-assistance','NGO / Social Assistance','🤝','Business Network','NGO discovery, social support and community assistance.'],
  ['professional-services','Professional Services','🧑‍💼','Business Network','Authorized professional discovery and referral workflows.'],
  ['corporate-business-services','Corporate / Business Services','🏢','Business Network','Corporate services, B2B assistance, partnerships and enterprise workflows.'],
  ['international-citizen-resident','International Citizen / Resident Services','🌐','Management & Scale','Cross-border citizen/resident services and international support pathways.'],
  ['transport-mobility','Transport & Mobility','🚗','Public Platform','Driving licence, vehicle, permits, transport and mobility-related services.'],
  ['food-nutrition','Food & Nutrition Services','🍲','Universal Assistance','Food security, ration, nutrition and related public-service pathways.'],
  ['skills-vocational-training','Skills & Vocational Training','🛠️','Service + Opportunity Intelligence','Skill development, vocational training, certifications and employability.'],
  ['housing-urban-development','Housing & Urban Development','🏗️','Public Platform','Housing, urban development, civic housing schemes and related services.'],
  ['environment-climate','Environment & Climate','🌱','Service + Opportunity Intelligence','Environment, climate, waste, sustainability and related public programs.'],
  ['public-safety-emergency','Public Safety & Emergency Support','🆘','Universal Assistance','Emergency-service discovery, safety routing and urgent assistance pathways.'],
  ['youth-sports-culture','Youth / Sports / Culture','🏅','Public Platform','Youth programs, sports, culture, talent and community opportunities.']
].map(([id,name,icon,pillar,description]) => ({
  id,
  name,
  icon,
  scope: 'India + International',
  pillar,
  description,
}));

export const CASE_UNIVERSE_COUNT = CASE_UNIVERSE.length;
