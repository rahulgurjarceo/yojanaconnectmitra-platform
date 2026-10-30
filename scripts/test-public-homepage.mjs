import fs from 'node:fs';
const page = fs.readFileSync('app/page.tsx','utf8');
const required = [
  'Government Schemes & Public Services','Documents & Certificates',
  'Education, Admissions & Scholarships','Jobs, Employment & Internships',
  'Business, Startups & MSME','Loans, Finance & Insurance',
  'Tax, GST & Accounting','Legal & Documentation Assistance',
  'Property & Land Assistance','Court & Authority Process Assistance',
  'Health Service Discovery','Travel, Passport & Visa',
  'Overseas Education & Employment','Women, Children & Family Support',
  'Disability & Social Welfare','Agriculture & Farmer Services',
  'Labour & Worker Services','Pension Services',
  'Banking & Financial-Service Assistance','Digital Services',
  'Utility Services','Consumer Complaints & Grievances',
  'Police & Public Grievance Routing','Local-Body & Municipal Services',
  'NGO & Social Assistance','Professional Services',
  'Corporate & Business Services','International Citizen & Resident Services',
  'Transport & Mobility','Food & Nutrition Services',
  'Skills & Vocational Training','Housing & Urban Development',
  'Environment & Climate','Public Safety & Emergency Support',
  'Youth, Sports & Culture'
];
for (const domain of required) {
  if (!page.includes(domain)) throw new Error('Homepage missing domain: '+domain);
}
for (const token of ['const [query, setQuery]','const [group, setGroup]','setSelected(d)','aria-modal="true"','/login','/contact','Service information is guidance only']) {
  if (!page.includes(token)) throw new Error('Homepage interaction/compliance contract missing: '+token);
}
if (!page.includes('domains.length')) throw new Error('Homepage domain catalogue count missing');
console.log('PUBLIC_HOMEPAGE_CONTRACT: PASS — 35 domains, search, category filters, workflow details, navigation and disclaimers.');
