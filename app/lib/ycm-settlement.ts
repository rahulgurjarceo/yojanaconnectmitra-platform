import postgres from 'postgres';
import {randomUUID} from 'node:crypto';

const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:8,prepare:false,connect_timeout:10,idle_timeout:20}):null};

export async function releaseEligibleSettlements(limit=500){
 const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED');
 try{return await sql.begin(async tx=>{
  const splits=await tx\`SELECT sp.split_id,sp.transaction_id,sp.recipient_user_id,sp.amount_paise,sp.settlement_eligible_at
    FROM ycm_transaction_splits sp
    JOIN ycm_financial_transactions t ON t.transaction_id=sp.transaction_id
    WHERE sp.recipient_type='agent'
      AND sp.status='credited'
      AND sp.settlement_released_at IS NULL
      AND sp.settlement_eligible_at<=NOW()
      AND t.state IN ('success','reconciled')
    ORDER BY sp.settlement_eligible_at ASC
    LIMIT \${limit}
    FOR UPDATE OF sp SKIP LOCKED\`;
  let released=0;
  for(const sp of splits){
   if(!sp.recipient_user_id)continue;
   const wallet=(await tx\`SELECT wallet_id,withdrawable_paise,status FROM ycm_wallet_accounts WHERE user_id=\${sp.recipient_user_id} FOR UPDATE\`)[0];
   if(!wallet||wallet.status!=='active')continue;
   const next=Number(wallet.withdrawable_paise)+Number(sp.amount_paise);
   await tx\`UPDATE ycm_wallet_accounts SET withdrawable_paise=\${next},updated_at=NOW() WHERE wallet_id=\${wallet.wallet_id}\`;
   await tx\`INSERT INTO ycm_wallet_entries(entry_id,wallet_id,transaction_id,split_id,entry_type,amount_paise,balance_after_paise,idempotency_key)
     VALUES(\${randomUUID()},\${wallet.wallet_id},\${sp.transaction_id},\${sp.split_id},'settlement_release',\${sp.amount_paise},\${next},\${'release:'+sp.split_id})
     ON CONFLICT(idempotency_key) DO NOTHING\`;
   await tx\`UPDATE ycm_transaction_splits SET settlement_released_at=NOW() WHERE split_id=\${sp.split_id}\`;
   released++;
  }
  return {released};
 });}finally{await sql.end({timeout:3});}
}
