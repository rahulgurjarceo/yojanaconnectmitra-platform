export type ValidityBasis='fixed_days'|'application_deadline'|'event_date'|'authority_rule'|'manual';

export type DocumentValidityRule={
  rule_id?:string|null;
  document_type:string;
  context_type:'service'|'channel'|'authority'|'general';
  context_code?:string|null;
  validity_days?:number|null;
  validity_basis:ValidityBasis;
  requires_before_deadline:boolean;
  warning_days:number;
  active?:boolean;
  metadata?:Record<string,unknown>;
};

export type DocumentComplianceResult={
  status:'valid'|'expiring_soon'|'expired'|'deadline_violation'|'manual_review'|'invalid_context';
  code:string;
  documentType:string;
  validFrom:string|null;
  validUntil:string|null;
  requiredBefore:string|null;
  ruleId:string|null;
  validityBasis:ValidityBasis|null;
  warningDays:number;
  customerMessage:string;
  staffMessage:string;
};

export function selectDocumentValidityRule(documentType:string, serviceCode:string, rules:DocumentValidityRule[]){
  const type=String(documentType).trim().toUpperCase();
  const service=String(serviceCode).trim().toUpperCase();
  const matches=rules.filter(r=>r.active!==false && String(r.document_type).trim().toUpperCase()===type);
  const rank=(r:DocumentValidityRule)=>{
    if(r.context_type==='service' && String(r.context_code||'').trim().toUpperCase()===service)return 400;
    if(r.context_type==='service' && !r.context_code)return 300;
    if(r.context_type==='channel')return 200;
    if(r.context_type==='authority')return 150;
    if(r.context_type==='general')return 100;
    return 0;
  };
  return [...matches].sort((a,b)=>rank(b)-rank(a))[0]||null;
}

export function evaluateDocumentCompliance(input:{
  documentType:string;
  validFrom?:string|Date|null;
  validUntil?:string|Date|null;
  rule?:DocumentValidityRule|null;
  applicationDeadline?:string|Date|null;
  eventDate?:string|Date|null;
  now?:string|Date;
}):DocumentComplianceResult{
  const now=new Date(input.now||Date.now());
  const from=input.validFrom?new Date(input.validFrom):null;
  const explicitUntil=input.validUntil?new Date(input.validUntil):null;
  const rule=input.rule||null;
  const deadline=input.applicationDeadline?new Date(input.applicationDeadline):null;
  const eventDate=input.eventDate?new Date(input.eventDate):null;
  const baseDate=from;
  let until=explicitUntil;
  let requiredBefore:Date|null=null;

  if(rule?.validity_basis==='fixed_days' && baseDate && rule.validity_days){
    until=new Date(baseDate);
    until.setUTCDate(until.getUTCDate()+rule.validity_days);
  } else if(rule?.validity_basis==='application_deadline'){
    requiredBefore=deadline;
    if(deadline && baseDate && baseDate.getTime()>deadline.getTime()){
      return result('deadline_violation','DOCUMENT_ISSUED_AFTER_APPLICATION_DEADLINE',input.documentType,from,until,deadline,rule,'Document was issued after the application deadline.','Document issue date is after the application deadline; obtain a compliant document or escalate for review.');
    }
    if(rule.requires_before_deadline && !deadline){
      return result('manual_review','APPLICATION_DEADLINE_REQUIRED',input.documentType,from,until,null,rule,'Application deadline is required to verify this document.','Application deadline is missing; deadline-based validity cannot be verified.');
    }
  } else if(rule?.validity_basis==='event_date'){
    requiredBefore=eventDate;
    if(eventDate && baseDate && baseDate.getTime()>eventDate.getTime()){
      return result('invalid_context','DOCUMENT_ISSUED_AFTER_EVENT_DATE',input.documentType,from,until,eventDate,rule,'Document was issued after the relevant event date.','Document issue date is after the required event date.');
    }
  }

  if(until && until.getTime()<now.getTime()){
    return result('expired','DOCUMENT_EXPIRED',input.documentType,from,until,requiredBefore,rule,'यह document इस service के लिए expire हो चुका है।','Document is expired for this service; upload the latest valid document.');
  }

  if(rule?.validity_basis==='fixed_days' && !baseDate && !until){
    return result('manual_review','DOCUMENT_DATE_REQUIRED',input.documentType,null,null,requiredBefore,rule,'Document की issue/valid-from date verify करनी होगी।','Issue/valid-from date is required before validity can be confirmed.');
  }

  if(rule?.requires_before_deadline && deadline && from && from.getTime()>deadline.getTime()){
    return result('deadline_violation','DOCUMENT_ISSUED_AFTER_APPLICATION_DEADLINE',input.documentType,from,until,deadline,rule,'यह document application की last date के बाद जारी हुआ है।','Document was issued after the application deadline.');
  }

  const warningMs=(rule?.warning_days??30)*86400000;
  if(until && until.getTime()<=now.getTime()+warningMs){
    return result('expiring_soon','DOCUMENT_EXPIRING_SOON',input.documentType,from,until,requiredBefore,rule,'यह document जल्द expire होगा; नया document पहले से तैयार रखें।','Document is nearing expiry; renewal/re-upload should be planned before submission.');
  }

  return result('valid','DOCUMENT_VALID',input.documentType,from,until,requiredBefore,rule,'यह document इस service के लिए valid है।','Document is valid for this service.');
}

function result(status:DocumentComplianceResult['status'],code:string,documentType:string,from:Date|null,until:Date|null,requiredBefore:Date|null,rule:DocumentValidityRule|null,customerMessage:string,staffMessage:string):DocumentComplianceResult{
  return {status,code,documentType,validFrom:from?.toISOString()||null,validUntil:until?.toISOString()||null,requiredBefore:requiredBefore?.toISOString()||null,ruleId:rule?.rule_id||null,validityBasis:rule?.validity_basis||null,warningDays:rule?.warning_days??0,customerMessage,staffMessage};
}
