import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:8,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const privileged=['ceo','management','admin'];

async function actorId(sql:ReturnType<typeof postgres>,sub:string){
 const rows=await sql`SELECT id FROM ycm_users WHERE user_id=\${sub} LIMIT 1`;
 return rows[0]?.id??null;
}

export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const id=await actorId(sql,s.sub);if(!id)return NextResponse.json({success:false,code:'USER_NOT_FOUND'},{status:404});
  const rows=await sql`SELECT settlement_id,amount_paise,method,status,reference,requested_at,processed_at,destination_id FROM ycm_settlements WHERE user_id=\${id} ORDER BY requested_at DESC LIMIT 100`;
  return NextResponse.json({success:true,settlements:rows});
 }finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as {amountPaise?:number;destinationId?:string}|null;
 if(!b?.destinationId||!Number.isInteger(b.amountPaise)||b.amountPaise<=0)return NextResponse.json({success:false,code:'SETTLEMENT_FIELDS_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{return await sql.begin(async tx=>{
  const user=(await tx`SELECT id FROM ycm_users WHERE user_id=\${s.sub} LIMIT 1`)[0];if(!user)throw new Error('USER_NOT_FOUND');
  const wallet=(await tx`SELECT wallet_id,available_paise,withdrawable_paise,status FROM ycm_wallet_accounts WHERE user_id=\${user.id} FOR UPDATE`)[0];
  if(!wallet)throw new Error('WALLET_NOT_FOUND');
  if(wallet.status!=='active')throw new Error('WALLET_FROZEN');
  if(Number(wallet.withdrawable_paise)<b.amountPaise)throw new Error('SETTLEMENT_NOT_ELIGIBLE_T1');
  if(Number(wallet.available_paise)<b.amountPaise)throw new Error('WALLET_BALANCE_INSUFFICIENT');
  const destination=(await tx`SELECT destination_id,method,status FROM ycm_payout_destinations WHERE destination_id=\${b.destinationId} AND user_id=\${user.id} LIMIT 1`)[0];
  if(!destination||destination.status!=='active')throw new Error('PAYOUT_DESTINATION_INVALID');
  const settlementId=randomUUID();
  const nextAvailable=Number(wallet.available_paise)-b.amountPaise;
  const nextWithdrawable=Number(wallet.withdrawable_paise)-b.amountPaise;
  await tx`INSERT INTO ycm_settlements(settlement_id,user_id,wallet_id,amount_paise,method,status,destination_id,requested_at) VALUES(\${settlementId},\${user.id},\${wallet.wallet_id},\${b.amountPaise},\${destination.method},'requested',\${destination.destination_id},NOW())`;
  await tx`UPDATE ycm_wallet_accounts SET available_paise=\${nextAvailable},withdrawable_paise=\${nextWithdrawable},lifetime_debited_paise=lifetime_debited_paise+\${b.amountPaise},updated_at=NOW() WHERE wallet_id=\${wallet.wallet_id}`;
  await tx`INSERT INTO ycm_wallet_entries(entry_id,wallet_id,entry_type,amount_paise,balance_after_paise,idempotency_key) VALUES(\${randomUUID()},\${wallet.wallet_id},'settlement_debit',\${b.amountPaise},\${nextAvailable},\${'settlement:'+settlementId})`;
  await tx`INSERT INTO ycm_settlement_events(event_id,settlement_id,event_type,reference) VALUES(\${randomUUID()},\${settlementId},'requested',\${destination.destination_id})`;
  return NextResponse.json({success:true,settlementId,status:'requested',method:destination.method,amountPaise:b.amountPaise},{status:201});
 });}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'SETTLEMENT_REQUEST_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!privileged.includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const b=await r.json().catch(()=>null) as {settlementId?:string;status?:'approved'|'processing'|'paid'|'failed'|'reversed';reference?:string}|null;
 if(!b?.settlementId||!b.status)return NextResponse.json({success:false,code:'SETTLEMENT_UPDATE_FIELDS_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{return await sql.begin(async tx=>{
  const settlement=(await tx`SELECT s.*,w.available_paise,w.withdrawable_paise FROM ycm_settlements s JOIN ycm_wallet_accounts w ON w.wallet_id=s.wallet_id WHERE s.settlement_id=\${b.settlementId} FOR UPDATE`)[0];
  if(!settlement)throw new Error('SETTLEMENT_NOT_FOUND');
  if(['paid','failed','reversed'].includes(settlement.status))return NextResponse.json({success:true,status:settlement.status,idempotent:true});
  if(b.status==='failed'||b.status==='reversed'){
   const next=Number(settlement.available_paise)+Number(settlement.amount_paise);
   const nextWithdrawable=Number(settlement.withdrawable_paise)+Number(settlement.amount_paise);
   await tx`UPDATE ycm_wallet_accounts SET available_paise=\${next},withdrawable_paise=\${nextWithdrawable},lifetime_debited_paise=GREATEST(0,lifetime_debited_paise-\${settlement.amount_paise}),updated_at=NOW() WHERE wallet_id=\${settlement.wallet_id}`;
   await tx`INSERT INTO ycm_wallet_entries(entry_id,wallet_id,entry_type,amount_paise,balance_after_paise,idempotency_key) VALUES(\${randomUUID()},\${settlement.wallet_id},'adjustment_credit',\${settlement.amount_paise},\${next},\${'settlement-failed:'+settlement.settlement_id}) ON CONFLICT(idempotency_key) DO NOTHING`;
  }
  await tx`UPDATE ycm_settlements SET status=\${b.status},reference=\${b.reference??null},processed_at=CASE WHEN \${b.status} IN ('paid','failed','reversed') THEN NOW() ELSE processed_at END WHERE settlement_id=\${settlement.settlement_id}`;
  await tx`INSERT INTO ycm_settlement_events(event_id,settlement_id,event_type,reference) VALUES(\${randomUUID()},\${settlement.settlement_id},\${b.status},\${b.reference??null})`;
  return NextResponse.json({success:true,settlementId:settlement.settlement_id,status:b.status});
 });}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'SETTLEMENT_UPDATE_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}
