import postgres from "postgres";
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url){console.error("DATABASE_NOT_CONFIGURED");process.exit(1);}
const sql=postgres(url,{max:4,prepare:false,connect_timeout:10,idle_timeout:20});
const result={checked:0,escalated:0,skipped:0};
try{
 const rules=await sql`SELECT rule_id,name,trigger_type,threshold_value,escalate_to_team,escalate_after_minutes FROM ycm_case_escalation_rules WHERE active=true ORDER BY created_at`;
 const cases=await sql`SELECT c.case_id,c.family_id,c.status,c.priority,c.due_at,c.assigned_to,c.updated_at,COALESCE(cri.cri_score,100) cri_score
   FROM ycm_family_cases c LEFT JOIN ycm_case_cri cri ON cri.case_id=c.case_id
   WHERE c.status NOT IN ('completed','closed','resolved')`;
 result.checked=cases.length;
 for(const c of cases){
  for(const rule of rules){
   let triggered=false;
   if(rule.trigger_type==='tat_breach'&&c.due_at&&new Date(c.due_at).getTime()<Date.now()) triggered=true;
   if(rule.trigger_type==='cri_below'&&c.cri_score<Number(rule.threshold_value||60)) triggered=true;
   if(rule.trigger_type==='no_update'&&Number(rule.threshold_value||0)>0&&Date.now()-new Date(c.updated_at).getTime()>Number(rule.threshold_value)*60000) triggered=true;
   if(rule.trigger_type==='rejection'&&['rejected','rework'].includes(String(c.status))) triggered=true;
   if(!triggered){result.skipped++;continue;}
   const recent=await sql`SELECT 1 FROM ycm_case_timeline WHERE case_id=${c.case_id} AND event_type='auto_escalated' AND metadata->>'ruleId'=${rule.rule_id} AND created_at>NOW()-INTERVAL '24 hours' LIMIT 1`;
   if(recent.length){result.skipped++;continue;}
   await sql.begin(async tx=>{
    await tx`UPDATE ycm_family_cases SET escalated_at=COALESCE(escalated_at,NOW()),updated_at=NOW() WHERE case_id=${c.case_id}`;
    await tx`UPDATE ycm_work_assignments SET status='reassigned',escalation_level=escalation_level+1,updated_at=NOW() WHERE case_id=${c.case_id} AND status NOT IN ('completed','reassigned')`;
    await tx`INSERT INTO ycm_work_assignments(family_id,case_id,source_type,source_id,assigned_to,team_id,priority,status,reason,due_at,escalation_level) VALUES(${c.family_id},${c.case_id},'case',${c.case_id},NULL,${rule.escalate_to_team||null},CASE WHEN ${c.priority}='urgent' THEN 'urgent' ELSE 'high' END,'assigned',${rule.name},NOW()+(${Number(rule.escalate_after_minutes||0)} || ' minutes')::interval,1)`;
    await tx`INSERT INTO ycm_case_timeline(case_id,family_id,event_type,actor_type,note,metadata) VALUES(${c.case_id},${c.family_id},'auto_escalated','system',${rule.name},${JSON.stringify({ruleId:rule.rule_id,trigger:rule.trigger_type,criScore:c.cri_score})}::jsonb)`;
   });
   result.escalated++;
  }
 }
 console.log(JSON.stringify({success:true,...result}));
}finally{await sql.end({timeout:3});}
