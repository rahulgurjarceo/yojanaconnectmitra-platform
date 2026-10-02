import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {calculateUnifiedAllocation,UnifiedCommissionRule} from './ycm-unified-commission';

const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:8,prepare:false,connect_timeout:10,idle_timeout:20}):null};

export type RecordFinancialTransactionInput={
 externalReference:string;transactionType:string;serviceCode?:string;customerUserId?:string;agentUserId?:string;referralUserId?:string;providerCode?:string;providerTransactionId?:string;grossAmountPaise:number;providerFeePaise?:number;currency?:string;metadata?:Record<string,unknown>;rule:UnifiedCommissionRule;
};

export async function recordSuccessfulFinancialTransaction(input:RecordFinancialTransactionInput){
 const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED');
 const providerFee=input.providerFeePaise??0;
 if(!Number.isInteger(input.grossAmountPaise)||input.grossAmountPaise<0)throw new Error('GROSS_AMOUNT_INVALID');
 if(!Number.isInteger(providerFee)||providerFee<0||providerFee>input.grossAmountPaise)throw new Error('PROVIDER_FEE_INVALID');
 const allocation=calculateUnifiedAllocation(input.grossAmountPaise,input.rule);
 try{return await sql.begin(async tx=>{
  const existing=(await tx`SELECT transaction_id,state FROM ycm_financial_transactions WHERE external_reference=${input.externalReference} LIMIT 1`)[0];
  if(existing?.state==='success'||existing?.state==='reconciled')return {transactionId:existing.transaction_id,idempotent:true,allocation};
  const transactionId=existing?.transaction_id??randomUUID();
  if(!existing)await tx`INSERT INTO ycm_financial_transactions(transaction_id,external_reference,transaction_type,service_code,customer_user_id,agent_user_id,referral_user_id,provider_code,provider_transaction_id,gross_amount_paise,provider_fee_paise,net_amount_paise,currency,state,metadata) VALUES(${transactionId},${input.externalReference},${input.transactionType},${input.serviceCode??null},${input.customerUserId??null},${input.agentUserId??null},${input.referralUserId??null},${input.providerCode??null},${input.providerTransactionId??null},${input.grossAmountPaise},${providerFee},${input.grossAmountPaise-providerFee},${input.currency??'INR'},'success',${JSON.stringify(input.metadata??{})}::jsonb)`;
  else await tx`UPDATE ycm_financial_transactions SET state='success',provider_transaction_id=${input.providerTransactionId??null},updated_at=NOW() WHERE transaction_id=${transactionId}`;
  const addSplit=async(type:string,userId:string|null,percent:number,amount:number,funding:string)=>{
   const splitId=randomUUID();
   await tx`INSERT INTO ycm_transaction_splits(split_id,transaction_id,recipient_type,recipient_user_id,percent,amount_paise,funding_source,status) VALUES(${splitId},${transactionId},${type},${userId},${percent},${amount},${funding},'pending') ON CONFLICT DO NOTHING`;
   if(userId&&amount>0){
    const wallet=(await tx`INSERT INTO ycm_wallet_accounts(user_id) VALUES(${userId}) ON CONFLICT(user_id) DO UPDATE SET updated_at=NOW() RETURNING wallet_id,available_paise`)[0];
    const balance=Number(wallet.available_paise)+amount;
    await tx`UPDATE ycm_wallet_accounts SET available_paise=${balance},lifetime_credited_paise=lifetime_credited_paise+${amount},updated_at=NOW() WHERE wallet_id=${wallet.wallet_id}`;
    await tx`INSERT INTO ycm_wallet_entries(entry_id,wallet_id,transaction_id,split_id,entry_type,amount_paise,balance_after_paise,idempotency_key) VALUES(${randomUUID()},${wallet.wallet_id},${transactionId},${splitId},'commission_credit',${amount},${balance},${input.externalReference+':'+type}) ON CONFLICT(idempotency_key) DO NOTHING`;
    await tx`UPDATE ycm_transaction_splits SET status='credited' WHERE split_id=${splitId}`;
   }
  };
  await addSplit('ycm',null,input.rule.ycmPercent,allocation.ycmPaise,'gross');
  await addSplit('agent',input.agentUserId??null,input.rule.partnerPercent,allocation.agentPaise,'gross');
  await addSplit('referral',input.referralUserId??null,input.rule.referralPercent,allocation.referralPaise,input.rule.referralFundedBy??'agent');
  return {transactionId,idempotent:false,allocation};
 });}finally{await sql.end({timeout:3});}
}

export async function reverseFinancialTransaction(externalReference:string){
 const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED');
 try{return await sql.begin(async tx=>{
  const t=(await tx`SELECT * FROM ycm_financial_transactions WHERE external_reference=${externalReference} FOR UPDATE`)[0];if(!t)throw new Error('TRANSACTION_NOT_FOUND');if(t.state==='reversed')return {transactionId:t.transaction_id,idempotent:true};
  const entries=await tx`SELECT e.*,w.wallet_id,w.available_paise FROM ycm_wallet_entries e JOIN ycm_wallet_accounts w ON w.wallet_id=e.wallet_id WHERE e.transaction_id=${t.transaction_id} AND e.entry_type='commission_credit' AND e.amount_paise>0 FOR UPDATE`;
  for(const e of entries){const balance=Number(e.available_paise)-Number(e.amount_paise);if(balance<0)throw new Error('WALLET_INSUFFICIENT_FOR_REVERSAL');await tx`UPDATE ycm_wallet_accounts SET available_paise=${balance},lifetime_debited_paise=lifetime_debited_paise+${e.amount_paise},updated_at=NOW() WHERE wallet_id=${e.wallet_id}`;await tx`INSERT INTO ycm_wallet_entries(entry_id,wallet_id,transaction_id,entry_type,amount_paise,balance_after_paise,idempotency_key) VALUES(${randomUUID()},${e.wallet_id},${t.transaction_id},'commission_reversal',${e.amount_paise},${balance},${externalReference+':reverse:'+e.entry_id})`;};
  await tx`UPDATE ycm_financial_transactions SET state='reversed',updated_at=NOW() WHERE transaction_id=${t.transaction_id}`;await tx`UPDATE ycm_transaction_splits SET status='reversed' WHERE transaction_id=${t.transaction_id} AND status='credited'`;return {transactionId:t.transaction_id,idempotent:false};
 });}finally{await sql.end({timeout:3});}
}