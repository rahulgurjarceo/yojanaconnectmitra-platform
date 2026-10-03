import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {assertCompanyFinanceRole,getCompanyFinancialControlSummary} from '../../../../../lib/ycm-company-financial-control';
export const runtime='nodejs';
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 try{assertCompanyFinanceRole(s.role);const raw=Number(r.nextUrl.searchParams.get('months')||12);const data=await getCompanyFinancialControlSummary(Number.isFinite(raw)?raw:12);return NextResponse.json({success:true,data},{headers:{'Cache-Control':'private, no-store'}});}catch(e){const code=e instanceof Error?e.message:'FINANCE_REPORT_FAILED';return NextResponse.json({success:false,code},{status:code==='FORBIDDEN'?403:500});}
}
