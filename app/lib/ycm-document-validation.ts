export type DocumentValidation={status:'verified'|'mismatch'|'manual_review';errors:Array<{code:string;field:string;message:string}>};
function normalize(value:unknown){return String(value??'').normalize('NFKC').toUpperCase().replace(/[.,'’"()\-_/\\]/g,' ').replace(/\s+/g,' ').trim();}
function sameName(a:string,b:string){const aa=normalize(a),bb=normalize(b);if(!aa||!bb)return false;if(aa===bb)return true;const at=aa.split(' ').filter(Boolean),bt=bb.split(' ').filter(Boolean);return at.length>1&&bt.length>1&&at.every(x=>bt.includes(x))&&bt.every(x=>at.includes(x));}
export function validateDocumentAgainstMember(extracted:Record<string,unknown>,member:{full_name?:string|null;date_of_birth?:string|null}|null,confidence:Record<string,number>={}):DocumentValidation{
 if(!member)return{status:'manual_review',errors:[{code:'MEMBER_NOT_FOUND',field:'member',message:'Member could not be resolved.'}]};
 const errors:DocumentValidation['errors']=[],name=String(extracted.name??extracted.full_name??'').trim();
 if(name&&member.full_name&&!sameName(name,member.full_name))errors.push({code:'NAME_MISMATCH',field:'name',message:'नाम मिसमैच है, पहले इसे सुधारें।'});
 const dob=normalize(extracted.date_of_birth??extracted.dob??''),memberDob=normalize(member.date_of_birth??'');
 if(dob&&memberDob&&dob!==memberDob)errors.push({code:'DOB_MISMATCH',field:'date_of_birth',message:'जन्म तिथि मिसमैच है, पहले इसे सुधारें।'});
 const low=Object.entries(confidence).some(([f,v])=>['name','full_name','date_of_birth','dob'].includes(f)&&Number(v)<0.85);
 if(errors.length)return{status:'mismatch',errors};
 if(low||(!name&&!dob))return{status:'manual_review',errors:[{code:'LOW_CONFIDENCE',field:'document',message:'Document data needs human review before verification.'}]};
 return{status:'verified',errors:[]};
}
