import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
import {buildAuditRecord} from '../../../lib/ycm-audit-events';
import {getPostgresYcmAuditStore} from '../../../lib/ycm-postgres-audit-store';

export const runtime='nodejs';
const textMax=(v:unknown,max:number)=>v===undefined||v===null||typeof v==='string'&&v.trim().length<=max;
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const isRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const adminRoles=['ceo','management','admin'];
const failure=(code:string,status=400)=>NextResponse.json({success:false,code},{status,headers:{'Cache-Control':'no-store'}});
const auditChange=(s:{sub:string;role:string;sessionId:string},id:string)=>{const audit=getPostgresYcmAuditStore();if(audit)return audit.append(buildAuditRecord({event:'PAYOUT_DESTINATION_CHANGED',subject:s.sub,role:s.role,sessionId:s.sessionId,resourceType:'payout_destination',resourceId:id,success:true})).catch(()=>{});};

export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return failure('AUTHENTICATION_REQUIRED',401);
 const sql=db();if(!sql)return failure('DATABASE_NOT_CONFIGURED',503);
 try{
  const rows=await sql`SELECT d.destination_id,d.method,d.label,d.account_holder_name,d.bank_account_last4,d.bank_ifsc,d.upi_id,d.provider,d.status,d.is_default,d.created_at,d.updated_at
    FROM ycm_payout_destinations d JOIN ycm_users u ON u.id=d.user_id
    WHERE u.user_id=${s.sub} ORDER BY d.is_default DESC,d.created_at DESC`;
  return NextResponse.json({success:true,destinations:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return failure('PAYOUT_DESTINATIONS_FETCH_FAILED',500);}
 finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return failure('AUTHENTICATION_REQUIRED',401);
 const raw:unknown=await r.json().catch(()=>null);if(!isRecord(raw))return failure('INVALID_REQUEST_BODY');
 const b=raw;
 if(!['bank','upi','manual'].includes(String(b.method))||typeof b.label!=='string'||!b.label.trim())return failure('PAYOUT_DESTINATION_FIELDS_REQUIRED');
 const method=b.method as 'bank'|'upi'|'manual';const label=b.label as string;
 if(!textMax(b.label,100)||!textMax(b.accountHolderName,120)||!textMax(b.bankIfsc,20)||!textMax(b.upiId,120)||!textMax(b.provider,80)||!textMax(b.providerBeneficiaryId,160))return failure('PAYOUT_DESTINATION_TEXT_TOO_LONG');
 for(const key of ['accountHolderName','bankIfsc','upiId','provider','providerBeneficiaryId'])if(b[key]!==undefined&&b[key]!==null&&typeof b[key]!=='string')return failure('PAYOUT_DESTINATION_INVALID_FIELD');
 if(b.isDefault!==undefined&&typeof b.isDefault!=='boolean')return failure('PAYOUT_DESTINATION_INVALID_FIELD');
 if(b.method==='bank'&&(!b.bankAccountLast4||!b.bankIfsc))return failure('BANK_DESTINATION_FIELDS_REQUIRED');
 if(b.method==='upi'&&(typeof b.upiId!=='string'||!b.upiId.trim()))return failure('UPI_DESTINATION_FIELDS_REQUIRED');
 if(b.bankAccountLast4!==undefined&&b.bankAccountLast4!==null&&(typeof b.bankAccountLast4!=='string'||!/^\d{4}$/.test(b.bankAccountLast4)))return failure('BANK_LAST4_INVALID');
 if(b.method==='bank'&&typeof b.bankIfsc==='string'&&!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(b.bankIfsc.trim()))return failure('BANK_IFSC_INVALID');
 if(b.method==='upi'&&typeof b.upiId==='string'&&!/^[^\s@]+@[^\s@]+$/.test(b.upiId.trim()))return failure('UPI_ID_INVALID');
 const sql=db();if(!sql)return failure('DATABASE_NOT_CONFIGURED',503);
 try{return await sql.begin(async tx=>{
  const user=(await tx`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0];if(!user)throw new Error('USER_NOT_FOUND');
  if(isDefault===true)await tx`UPDATE ycm_payout_destinations SET is_default=false,updated_at=NOW() WHERE user_id=${user.id}`;
  const id=randomUUID();const initialStatus=adminRoles.includes(s.role)?'active':'pending_verification';
  const row=(await tx`INSERT INTO ycm_payout_destinations(destination_id,user_id,method,label,account_holder_name,bank_account_last4,bank_ifsc,upi_id,provider,provider_beneficiary_id,status,is_default)
    VALUES(${id},${user.id},${method},${label.trim()},${typeof b.accountHolderName==='string'?b.accountHolderName.trim():null},${typeof b.bankAccountLast4==='string'?b.bankAccountLast4:null},${typeof b.bankIfsc==='string'?b.bankIfsc.trim().toUpperCase():null},${typeof b.upiId==='string'?b.upiId.trim():null},${typeof b.provider==='string'?b.provider.trim():null},${typeof b.providerBeneficiaryId==='string'?b.providerBeneficiaryId.trim():null},${initialStatus},${b.isDefault===true}) RETURNING destination_id,method,label,account_holder_name,bank_account_last4,bank_ifsc,upi_id,provider,status,is_default`)[0];
  await auditChange(s,id);return NextResponse.json({success:true,destination:row},{status:201,headers:{'Cache-Control':'no-store'}});
 });}catch(e){const code=e instanceof Error&&['USER_NOT_FOUND'].includes(e.message)?e.message:'PAYOUT_DESTINATION_CREATE_FAILED';return failure(code,code==='USER_NOT_FOUND'?404:400);}finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return failure('AUTHENTICATION_REQUIRED',401);
 const raw:unknown=await r.json().catch(()=>null);if(!isRecord(raw))return failure('INVALID_REQUEST_BODY');
 const b=raw;
 if(typeof b.destinationId!=='string'||!b.destinationId.trim()||b.destinationId.length>100)return failure('DESTINATION_ID_REQUIRED');
 const destinationId=b.destinationId as string;const status=b.status as 'active'|'disabled'|'pending_verification'|undefined;const isDefault=b.isDefault as boolean|undefined;
 if(b.status!==undefined&&!['active','disabled','pending_verification'].includes(String(b.status)))return failure('PAYOUT_DESTINATION_STATUS_INVALID');
 if(b.isDefault!==undefined&&typeof b.isDefault!=='boolean')return failure('PAYOUT_DESTINATION_INVALID_FIELD');
 if(b.status==='active'&&!adminRoles.includes(s.role))return failure('PAYOUT_DESTINATION_VERIFICATION_REQUIRED',403);
 const sql=db();if(!sql)return failure('DATABASE_NOT_CONFIGURED',503);
 try{return await sql.begin(async tx=>{
  const user=(await tx`SELECT id FROM ycm_users WHERE user_id=${s.sub} LIMIT 1`)[0];if(!user)return failure('USER_NOT_FOUND',404);
  // Confirm ownership before changing any default flags; a guessed/non-owned ID must not mutate account state.
  const owned=(await tx`SELECT destination_id FROM ycm_payout_destinations WHERE destination_id=${destinationId} AND user_id=${user.id} FOR UPDATE`)[0];
  if(!owned)return failure('PAYOUT_DESTINATION_NOT_FOUND',404);
  if(b.isDefault===true)await tx`UPDATE ycm_payout_destinations SET is_default=false,updated_at=NOW() WHERE user_id=${user.id}`;
  const rows=await tx`UPDATE ycm_payout_destinations SET status=COALESCE(${status??null},status),is_default=COALESCE(${isDefault??null},is_default),updated_at=NOW() WHERE destination_id=${destinationId} AND user_id=${user.id} RETURNING destination_id,method,label,status,is_default`;
  await auditChange(s,destinationId);
  return NextResponse.json({success:true,destination:rows[0]},{headers:{'Cache-Control':'no-store'}});
 });}catch{return failure('PAYOUT_DESTINATION_UPDATE_FAILED',500);}finally{await sql.end({timeout:3});}
}
