import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {assertCompanyFinanceRole} from '../../../../../lib/ycm-company-financial-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function GET(r:NextRequest){const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});try{assertCompanyFinanceRole(s.role);const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED');const rows=await sql`SELECT asset_id,asset_code,asset_category,asset_name,quantity,purchase_amount_paise,current_value_paise,assigned_employee_user_id,location,status,purchase_date FROM ycm_company_assets ORDER BY purchase_date DESC LIMIT 1000`;return NextResponse.json({success:true,assets:rows},{headers:{'Cache-Control':'private, no-store'}});}catch(e){const code=e instanceof Error?e.message:'ASSET_REPORT_FAILED';return NextResponse.json({success:false,code},{status:code==='FORBIDDEN'?403:500});}}
