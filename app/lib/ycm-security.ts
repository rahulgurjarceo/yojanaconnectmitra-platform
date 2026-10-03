import { createHash } from 'node:crypto';

export function hashSecurityIdentifier(value:string):string{
 return createHash('sha256').update(value.trim().toLowerCase(),'utf8').digest('hex');
}

export function assertSafePublicIdentifier(value:string,maxLength=128):string{
 const v=value.trim();
 if(!v||v.length>maxLength)throw new Error('SECURITY_IDENTIFIER_INVALID');
 if(/[\u0000-\u001f\u007f]/.test(v))throw new Error('SECURITY_IDENTIFIER_INVALID');
 return v;
}

export function assertPositiveInteger(value:unknown,code='SECURITY_INTEGER_INVALID'):number{
 if(!Number.isSafeInteger(value)||Number(value)<=0)throw new Error(code);
 return Number(value);
}
