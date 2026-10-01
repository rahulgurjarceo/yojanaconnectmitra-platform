export type LegalSourceKind = "ACT" | "SECTION" | "RULE" | "REGULATION" | "NOTIFICATION" | "ORDER" | "CIRCULAR" | "CASE" | "JUDGMENT";

export type LegalSource = {
  id:string;
  authority:string;
  title:string;
  kind:LegalSourceKind;
  country:string;
  jurisdiction:string;
  officialUrl:string;
  notes:string;
};

export const INDIA_OFFICIAL_SOURCES: LegalSource[] = [
 {id:"india-code",authority:"India Code",title:"Central and State legal texts",kind:"ACT",country:"India",jurisdiction:"India",officialUrl:"https://www.indiacode.nic.in/",notes:"Primary source registry for Acts and subordinate legislation."},
 {id:"ecourts",authority:"eCourts",title:"Case status, orders and judgments",kind:"CASE",country:"India",jurisdiction:"India",officialUrl:"https://ecourts.gov.in/",notes:"Use for court-service lookup; verify results in the relevant court system."},
 {id:"nalsa",authority:"NALSA",title:"Legal aid and legal services",kind:"ORDER",country:"India",jurisdiction:"India",officialUrl:"https://nalsa.gov.in/",notes:"Legal-aid routing source."},
];

export function buildLegalSearchPlan(input:{query:string;country:string;jurisdiction:string;category?:string}){
 const isIndia=input.country.toLowerCase()==="india";
 return {
  query:input.query.trim(),
  country:input.country,
  jurisdiction:input.jurisdiction,
  category:input.category||"",
  sourcePriority:isIndia?["India Code","eCourts","NALSA","relevant regulator/court"]:["Jurisdiction's official legislation source","Official court/tribunal source","Official legal-aid authority"],
  verification:["Confirm jurisdiction","Open the primary/official source","Check effective/current version or order date","Record source URL and retrieval date","Human lawyer review before legal advice or filing"]
 };
}
