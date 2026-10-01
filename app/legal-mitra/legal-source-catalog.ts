export type LegalSourceCatalogItem = {
  id: string;
  name: string;
  authority: string;
  jurisdiction: string;
  scope: string[];
  priority: "PRIMARY" | "SECONDARY";
  url: string;
};

export const LEGAL_SOURCE_CATALOG: LegalSourceCatalogItem[] = [
  {id:"india-code",name:"India Code",authority:"Government of India",jurisdiction:"India",scope:["Acts","Sections","Rules","Regulations","Notifications","Orders","Ordinances","Circulars","Schedules","Forms"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"nalsa",name:"NALSA",authority:"National Legal Services Authority",jurisdiction:"India",scope:["Free legal aid","Eligibility","Legal Services Authorities","Lok Adalat","Mediation","Victim compensation","Legal aid application"],priority:"PRIMARY",url:"https://nalsa.gov.in/"},
  {id:"ecourts",name:"eCourts Services",authority:"Department of Justice / eCommittee",jurisdiction:"India",scope:["Case status","CNR","Orders","Judgments","Cause lists","Advocate/case search"],priority:"PRIMARY",url:"https://services.ecourts.gov.in/"},
  {id:"cybercrime",name:"National Cyber Crime Reporting Portal",authority:"I4C / Ministry of Home Affairs",jurisdiction:"India",scope:["Cyber complaints","Financial fraud","Women/children cyber crime","Complaint tracking","Suspect reporting"],priority:"PRIMARY",url:"https://www.cybercrime.gov.in/"},
  {id:"bns",name:"Bharatiya Nyaya Sanhita, 2023",authority:"Ministry of Home Affairs / India Code",jurisdiction:"India",scope:["Criminal offences","Punishments","Definitions"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"bnss",name:"Bharatiya Nagarik Suraksha Sanhita, 2023",authority:"Ministry of Home Affairs / India Code",jurisdiction:"India",scope:["Criminal procedure","Courts","Bail","Investigation","Trial","Appeal"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"bsa",name:"Bharatiya Sakshya Adhiniyam, 2023",authority:"Ministry of Home Affairs / India Code",jurisdiction:"India",scope:["Evidence","Proof","Electronic/digital evidence"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"consumer",name:"Consumer Protection framework",authority:"Department of Consumer Affairs / India Code",jurisdiction:"India",scope:["Consumer disputes","E-commerce","Mediation","Consumer commissions"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"it-act",name:"Information Technology Act, 2000",authority:"MeitY / India Code",jurisdiction:"India",scope:["Electronic records","Cyber law","Intermediaries","Digital offences"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"women-dv",name:"Protection of Women from Domestic Violence Act, 2005",authority:"India Code",jurisdiction:"India",scope:["Domestic violence","Protection orders","Residence","Monetary relief","Custody","Compensation"],priority:"PRIMARY",url:"https://www.indiacode.nic.in/"},
  {id:"sebi",name:"SEBI Legal Framework",authority:"Securities and Exchange Board of India",jurisdiction:"India",scope:["Acts","Rules","Regulations","Circulars","Orders","Securities law"],priority:"PRIMARY",url:"https://www.sebi.gov.in/"},
  {id:"rbi",name:"RBI Legal / Regulatory framework",authority:"Reserve Bank of India",jurisdiction:"India",scope:["Banking","Payments","Loans","Digital lending","Ombudsman","Master Directions"],priority:"PRIMARY",url:"https://www.rbi.org.in/"},
  {id:"irdai",name:"IRDAI Legal / Regulatory framework",authority:"Insurance Regulatory and Development Authority of India",jurisdiction:"India",scope:["Insurance","Claims","Intermediaries","Regulations","Consumer protection"],priority:"PRIMARY",url:"https://irdai.gov.in/"},
  {id:"cci",name:"Competition Commission of India",authority:"CCI",jurisdiction:"India",scope:["Competition Act","Regulations","Notifications","Orders","Judgments"],priority:"PRIMARY",url:"https://www.cci.gov.in/"},
  {id:"ibbi",name:"IBBI Legal Framework",authority:"Insolvency and Bankruptcy Board of India",jurisdiction:"India",scope:["IBC","Regulations","Insolvency","Bankruptcy","Resolution"],priority:"PRIMARY",url:"https://www.ibbi.gov.in/"},
  {id:"trai",name:"TRAI Legal Framework",authority:"Telecom Regulatory Authority of India",jurisdiction:"India",scope:["Telecom Acts","Regulations","Orders","Consumer protection","Quality of service"],priority:"PRIMARY",url:"https://www.trai.gov.in/"},
  {id:"ipindia",name:"IP India",authority:"Office of CGPDTM",jurisdiction:"India",scope:["Patents","Trademarks","Designs","Geographical indications","IP rules"],priority:"PRIMARY",url:"https://ipindia.gov.in/"},
  {id:"incometax",name:"Income Tax Department",authority:"Government of India",jurisdiction:"India",scope:["Income tax","Direct tax","Rules","Circulars","Notifications","Forms"],priority:"PRIMARY",url:"https://www.incometax.gov.in/"},
  {id:"gst",name:"GST Portal",authority:"Government of India",jurisdiction:"India",scope:["GST law","Rules","Notifications","Circulars","Orders","Returns"],priority:"PRIMARY",url:"https://www.gst.gov.in/"},
  {id:"labour",name:"Ministry of Labour & Employment",authority:"Government of India",jurisdiction:"India",scope:["Labour legislation","Employment","Wages","Social security","Industrial relations"],priority:"PRIMARY",url:"https://labour.gov.in/"},
  {id:"mea",name:"Ministry of External Affairs",authority:"Government of India",jurisdiction:"India",scope:["Consular services","Treaties","International legal matters","Passports/visa policy"],priority:"PRIMARY",url:"https://www.mea.gov.in/"},
  {id:"passport",name:"Passport Seva",authority:"Ministry of External Affairs",jurisdiction:"India",scope:["Passport","Travel documents","Application procedures"],priority:"PRIMARY",url:"https://www.passportindia.gov.in/"},
  {id:"un-treaties",name:"United Nations Treaty Collection",authority:"United Nations",jurisdiction:"International",scope:["Multilateral treaties","Treaty status","Depositary notifications","Treaty texts"],priority:"PRIMARY",url:"https://treaties.un.org/"},
  {id:"wipo-lex",name:"WIPO Lex",authority:"World Intellectual Property Organization",jurisdiction:"Global / 200 jurisdictions",scope:["IP laws","IP regulations","IP treaties","IP judgments"],priority:"PRIMARY",url:"https://www.wipo.int/wipolex/"},
  {id:"hcch",name:"HCCH",authority:"Hague Conference on Private International Law",jurisdiction:"International",scope:["Private international law","Cross-border service","Evidence","Child protection","Choice of court"],priority:"PRIMARY",url:"https://www.hcch.net/"},
  {id:"uncitral",name:"UNCITRAL",authority:"United Nations Commission on International Trade Law",jurisdiction:"International",scope:["International commercial law","Arbitration","Insolvency","Electronic commerce","Model laws"],priority:"PRIMARY",url:"https://uncitral.un.org/"},
  {id:"ilo",name:"ILO NORMLEX",authority:"International Labour Organization",jurisdiction:"International",scope:["International labour standards","Conventions","Recommendations","National labour information"],priority:"PRIMARY",url:"https://normlex.ilo.org/"},
  {id:"un-human-rights",name:"UN Human Rights Treaty Bodies",authority:"United Nations OHCHR",jurisdiction:"International",scope:["Human rights treaties","Treaty bodies","Country reporting","General comments"],priority:"PRIMARY",url:"https://www.ohchr.org/"},
];

export const LEGAL_PRACTICE_AREAS = [
  "Criminal","Cyber Crime","Civil Litigation","Constitutional","Administrative","Property & Land","Family & Matrimonial",
  "Child Rights","Women & Gender Justice","Consumer","Labour & Employment","Business & Corporate","Contract","Commercial",
  "Insolvency & Bankruptcy","Tax","GST","Banking & Finance","Securities","Insurance","Competition / Antitrust","Intellectual Property",
  "Data Protection & Privacy","Technology","Telecom","Media & Entertainment","Healthcare & Pharma","Education","Environment",
  "Energy","Infrastructure / Construction","Aviation","Maritime","Immigration","Citizenship","Refugee / Asylum",
  "International Trade","International Arbitration","Mediation / ADR","Human Rights","Public International Law","Private International Law",
  "Wills / Probate / Estates","Trusts","Personal Injury","Sports","Real Estate","Agriculture / Rural Law","Legal Aid","Legal Documents"
] as const;
