import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;if(!u)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const sql=postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20});
 try{
  const userRows=await sql`SELECT id FROM ycm_users WHERE user_id=${userId} LIMIT 1`; const userId=userRows[0]?.id;
  if(!userId)return NextResponse.json({success:false,code:'USER_NOT_FOUND'},{status:404});
  const wallet=(await sql`SELECT wallet_id,currency,available_paise,pending_paise,withdrawable_paise,lifetime_credited_paise,lifetime_debited_paise,status,created_at,updated_at FROM ycm_wallet_accounts WHERE user_id=${s.sub} LIMIT 1`)[0]||null;
  const entries=wallet?await sql`SELECT entry_id,entry_type,amount_paise,balance_after_paise,transaction_id,created_at FROM ycm_wallet_entries WHERE wallet_id=${wallet.wallet_id} ORDER BY created_at DESC LIMIT 100`:[];
  const next=await sql`SELECT MIN(settlement_eligible_at) next_eligible_at,COALESCE(SUM(amount_paise),0) pending_settlement_paise FROM ycm_transaction_splits WHERE recipient_type='agent' AND recipient_user_id=${userId} AND status='credited' AND settlement_released_at IS NULL`;
  return NextResponse.json({success:true,wallet,entries,settlement:{policy:'T+1',withdrawablePaise:Number(wallet?.withdrawable_paise??0),pendingSettlementPaise:Number(next[0]?.pending_settlement_paise??0),nextEligibleAt:next[0]?.next_eligible_at??null}});
 }finally{await sql.end({timeout:3});}
}