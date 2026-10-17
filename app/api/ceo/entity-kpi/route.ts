import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const sess=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const allowed=['ceo','admin','management'];
export async function GET(r:NextRequest){
 const s=sess(r); if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 if(!allowed.includes(s.role))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});
 const sql=db(); if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 const u=new URL(r.url),type=u.searchParams.get('type'),state=u.searchParams.get('state'),district=u.searchParams.get('district'),block=u.searchParams.get('block'),q=u.searchParams.get('q');
 try{
  const entities=await sql`
   SELECT e.entity_id,e.entity_type,e.display_name,e.mobile,e.email,e.state_code,e.district_code,e.block_code,e.village_code,e.status,
          COUNT(DISTINCT w.work_id)::int work_items,
          COALESCE(SUM(w.target_count),0)::int target_count,
          COALESCE(SUM(w.completed_count),0)::int completed_count,
          COALESCE(SUM(w.pending_count),0)::int pending_count,
          COALESCE(SUM(CASE WHEN t.direction='in' AND t.status='completed' THEN t.amount ELSE 0 END),0)::numeric revenue_in,
          COALESCE(SUM(CASE WHEN t.direction='out' AND t.status='completed' THEN t.amount ELSE 0 END),0)::numeric payout_out,
          COALESCE(SUM(CASE WHEN t.status='completed' THEN t.commission_amount ELSE 0 END),0)::numeric commission,
          COUNT(DISTINCT CASE WHEN t.status='completed' THEN t.transaction_id END)::int completed_transactions
   FROM ycm_ceo_entities e
   LEFT JOIN ycm_ceo_entity_work w ON w.entity_id=e.entity_id
   LEFT JOIN ycm_ceo_entity_transactions t ON t.entity_id=e.entity_id
   WHERE (${type} IS NULL OR e.entity_type=${type})
     AND (${state} IS NULL OR e.state_code=${state})
     AND (${district} IS NULL OR e.district_code=${district})
     AND (${block} IS NULL OR e.block_code=${block})
     AND (${q} IS NULL OR e.display_name ILIKE '%'||${q}||'%' OR e.mobile ILIKE '%'||${q}||'%')
   GROUP BY e.entity_id
   ORDER BY revenue_in DESC, e.display_name ASC
   LIMIT 1000`;
  const summary=await sql`SELECT COUNT(*)::int entities,COUNT(*) FILTER(WHERE status='active')::int active_entities FROM ycm_ceo_entities`;
  const totals=await sql`SELECT COALESCE(SUM(amount) FILTER(WHERE direction='in' AND status='completed'),0)::numeric revenue_in,COALESCE(SUM(amount) FILTER(WHERE direction='out' AND status='completed'),0)::numeric payout_out,COALESCE(SUM(commission_amount) FILTER(WHERE status='completed'),0)::numeric commission,COUNT(*) FILTER(WHERE status='completed')::int completed_transactions FROM ycm_ceo_entity_transactions`;
  return NextResponse.json({success:true,summary:{...summary[0],...totals[0]},entities});
 }catch(e){return NextResponse.json({success:false,code:'CEO_ENTITY_KPI_QUERY_FAILED'},{status:500});}
}