import postgres from 'postgres';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;if(!u)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const sql=postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20});
 try{
  const wallet=(await sql`SELECT wallet_id,currency,available_paise,pending_paise,lifetime_credited_paise,lifetime_debited_paise,status,created_at,updated_at FROM ycm_wallet_accounts WHERE user_id=${s.sub} LIMIT 1`)[0]||null;
  const entries=wallet?await sql`SELECT entry_id,entry_type,amount_paise,balance_after_paise,transaction_id,created_at FROM ycm_wallet_entries WHERE wallet_id=${wallet.wallet_id} ORDER BY created_at DESC LIMIT 100`:[];
  return NextResponse.json({success:true,wallet,entries});
 }finally{await sql.end({timeout:3});}
}