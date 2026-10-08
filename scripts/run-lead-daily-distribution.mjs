import postgres from 'postgres';
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url) throw new Error('DATABASE_URL_NOT_CONFIGURED');
const sql=postgres(url,{max:5,prepare:false});
try{
 const setting=(await sql`SELECT target_per_day FROM ycm_lead_daily_settings WHERE setting_key='default_employee_daily_target' AND active=true LIMIT 1`)[0];
 const target=Math.max(1,Number(setting?.target_per_day||200));
 const already=Number((await sql`SELECT COALESCE(SUM(distributed_count),0) n FROM ycm_lead_daily_distribution WHERE distribution_date=CURRENT_DATE`)[0]?.n||0);
 let assigned=0;
 for(let i=already;i<target;i++){
  const lead=(await sql`SELECT lead_id FROM ycm_leads WHERE status IN ('new','qualified','follow_up') AND assigned_to IS NULL ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,lead_score DESC,created_at ASC LIMIT 1`)[0];
  if(!lead) break;
  const e=(await sql`SELECT u.id FROM ycm_users u WHERE u.role=ANY(${sql.array(['employee','team_lead','branch_manager'])}) AND u.status='active' ORDER BY (SELECT COUNT(*) FROM ycm_leads x WHERE x.assigned_to=u.id AND x.status NOT IN ('converted','lost','closed')) ASC,u.created_at ASC LIMIT 1`)[0];
  if(!e) break;
  await sql.begin(async tx=>{
   await tx`UPDATE ycm_leads SET assigned_to=${e.id},status='assigned',assigned_at=NOW(),assignment_version=assignment_version+1,updated_at=NOW() WHERE lead_id=${lead.lead_id} AND assigned_to IS NULL`;
   await tx`INSERT INTO ycm_lead_assignments(lead_id,assignee_user_id,sequence_no,release_reason) VALUES(${lead.lead_id},${e.id},1,'AUTOMATED_DAILY_DISTRIBUTION')`;
   await tx`INSERT INTO ycm_lead_daily_distribution(distribution_date,employee_user_id,target_count,distributed_count) VALUES(CURRENT_DATE,${e.id},${target},1) ON CONFLICT(distribution_date,employee_user_id) DO UPDATE SET distributed_count=ycm_lead_daily_distribution.distributed_count+1,target_count=${target}`;
  });
  assigned++;
 }
 console.log(JSON.stringify({target,already,assigned,total:already+assigned}));
}finally{await sql.end({timeout:3})}
