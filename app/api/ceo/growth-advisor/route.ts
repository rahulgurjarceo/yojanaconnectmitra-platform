import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);
 if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!['ceo','admin','management'].includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const [insights,tx,work]=await Promise.all([
   sql`SELECT * FROM ycm_ceo_insights WHERE status IN ('open','acknowledged','in_progress') ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'opportunity' THEN 3 ELSE 4 END,created_at DESC LIMIT 100`,
   sql`SELECT COALESCE(SUM(amount) FILTER(WHERE direction='in' AND status='completed'),0)::numeric revenue,COUNT(*) FILTER(WHERE status='completed')::int transactions FROM ycm_ceo_entity_transactions`,
   sql`SELECT COALESCE(SUM(target_count),0)::int target,COALESCE(SUM(completed_count),0)::int completed,COALESCE(SUM(pending_count),0)::int pending FROM ycm_ceo_entity_work`
  ]);
  const revenue=Number(tx[0]?.revenue||0),transactions=Number(tx[0]?.transactions||0),target=Number(work[0]?.target||0),completed=Number(work[0]?.completed||0),pending=Number(work[0]?.pending||0);
  const advisor=[];
  if(target>0&&completed/target<0.7)advisor.push({category:'operations',severity:'warning',title:'Execution gap detected',signal:`Work completion is ${Math.round(completed/target*100)}% of target.`,recommendation:'Review blocked/pending work by owner and geography, then assign a daily recovery target.'});
  if(transactions===0)advisor.push({category:'sales',severity:'critical',title:'No completed transactions recorded',signal:'The transaction ledger currently has zero completed transactions.',recommendation:'Check lead intake, service conversion, payment/provider connection and transaction recording before increasing acquisition spend.'});
  if(pending>completed&&pending>10)advisor.push({category:'operations',severity:'warning',title:'Pending work is higher than completed work',signal:`${pending} pending vs ${completed} completed work units.`,recommendation:'Prioritize ageing cases and identify the owner/team causing the queue.'});
  if(revenue>0&&transactions>0)advisor.push({category:'finance',severity:'info',title:'Revenue visibility available',signal:`Recorded revenue ₹${revenue.toLocaleString('en-IN')} across ${transactions} completed transactions.`,recommendation:'Compare revenue per entity, service and geography before reallocating sales or marketing effort.'});
  return NextResponse.json({success:true,advisor,insights});
 }catch(e){return NextResponse.json({success:false,code:'CEO_GROWTH_ADVISOR_QUERY_FAILED'},{status:500});}
}