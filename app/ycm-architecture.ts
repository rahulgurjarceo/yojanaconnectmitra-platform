export type ModuleStatus = 'foundation' | 'partial' | 'planned';

export type YCMModule = {
  id: string;
  number: number;
  name: string;
  status: ModuleStatus;
  description: string;
  capabilities: string[];
  nextBuild: string[];
};

export const YCM_MODULES: YCMModule[] = [
  { id:'public-platform', number:1, name:'Public Platform', status:'foundation', description:'Citizen-facing discovery and service entry point.', capabilities:['Website','Search','Services','Jobs','Scholarships','Schemes','Education','Business','Centres'], nextBuild:['Verified catalogue','Authenticated search','Centre directory'] },
  { id:'family-360', number:2, name:'Customer + Family 360', status:'partial', description:'Master customer and family record shared across YCM.', capabilities:['Customer Index','Family','Members','Consent','Verified Facts','Documents'], nextBuild:['Customer master ID','Family/member APIs','Consent ledger','Document vault'] },
  { id:'universal-assistance', number:3, name:'Universal Assistance', status:'partial', description:'AI Mitra and Human Mitra intake-to-ticket assistance.', capabilities:['Need','AI Mitra','Human Mitra','Voice','WhatsApp','Ticket'], nextBuild:['Need intake API','Ticket lifecycle','AI-to-human handoff'] },
  { id:'service-intelligence', number:4, name:'Service + Opportunity Intelligence', status:'foundation', description:'Canonical 35-domain service universe and opportunity routing.', capabilities:['35 Service Domains','Sub-services','Government','Jobs','Scholarships','Education','Business','Finance','Insurance','Legal'], nextBuild:['Sub-service registry','Eligibility rules','Opportunity catalogue'] },
  { id:'execution', number:5, name:'Execution', status:'partial', description:'Turns an eligible case into a tracked application and outcome.', capabilities:['Eligibility','Documents','Preparation','Application','Payment','Provider/Authority','Tracking','Outcome'], nextBuild:['Case state machine','Application records','Provider routing','TAT engine'] },
  { id:'crm', number:6, name:'CRM', status:'foundation', description:'Operational relationship and case management layer.', capabilities:['Lead','Opportunity','Task','Call','Application','Ticket','Complaint','Referral'], nextBuild:['Dedicated case fields','Opportunity/task APIs','Application/ticket routing'] },
  { id:'business-network', number:7, name:'Business Network', status:'planned', description:'Partner and vendor ecosystem with fulfilment and settlement.', capabilities:['Business','Products','Services','Stock','Partners','Vendors','Leads','Fulfilment','Settlement'], nextBuild:['Partner registry','Vendor onboarding','Order/fulfilment workflow','Settlement ledger'] },
  { id:'field-offline', number:8, name:'Field + Offline', status:'planned', description:'Mitra-led door-to-door and centre operations synchronized with YCM.', capabilities:['Mitra','Door-to-door','Field Visit','Geo/Time','Centre','Documents','Online Sync'], nextBuild:['Mitra app','Visit capture','Camp registration','Offline sync queue'] },
  { id:'hr-erp', number:9, name:'Employee / HR / ERP', status:'planned', description:'Internal workforce, assets and operational workflows.', capabilities:['Employee','Attendance','Leave','Targets','Performance','Payroll','Assets','Inventory','Internal Workflows'], nextBuild:['Employee master','Attendance/leave','Targets','Asset/inventory registers'] },
  { id:'finance', number:10, name:'Finance', status:'partial', description:'Money movement, accounting and management finance layer.', capabilities:['Billing','Collection','Expense','Commission','Wallet','Ledger','Reconciliation','P&L'], nextBuild:['Ledger API','Invoice/receipt model','Reconciliation','P&L reporting'] },
  { id:'cri', number:11, name:'CRI', status:'planned', description:'Case Resolution Intelligence and outcome-quality measurement.', capabilities:['Resolution','Time','Documents','Visits','Routing','Satisfaction','Outcome quality'], nextBuild:['CRI score','SLA/TAT metrics','CSAT','Resolution analytics'] },
  { id:'management', number:12, name:'Management / CEO Command Center', status:'partial', description:'One control layer for Admin, Compliance, Finance, HR, Operations, AI and field/camp activity.', capabilities:['Admin','Compliance','Finance','HR','Operations','CEO Command Center','AI','Door-to-door','Camps'], nextBuild:['Role dashboards','Live KPIs','AI operational assistant','Camp/field command board'] }
];

export const YCM_LIFECYCLE = ['Customer/Family','Need','Case','35 Domain','Sub-service','Eligibility','Documents','Consent','Payment','Execution','Application','Tracking','Outcome','CRI/CSAT','Management'];
