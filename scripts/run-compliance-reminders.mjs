import postgres from 'postgres';

const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url) throw new Error('DATABASE_URL or POSTGRES_URL is required');
const sql=postgres(url,{max:2,prepare:false,connect_timeout:10,idle_timeout:20});

try{
 const schedules=await sql`SELECT cs.*,d.document_type,d.valid_until,d.status AS document_status
   FROM ycm_compliance_schedules cs
   LEFT JOIN ycm_family_documents d ON d.document_id=cs.document_id
   WHERE cs.status IN ('active','due','overdue')
     AND cs.next_due_at <= NOW() + (GREATEST(cs.warning_days,0) || ' days')::interval
   ORDER BY cs.next_due_at ASC LIMIT 5000`;
 let created=0;
 for(const s of schedules){
   const reminderKind=new Date(s.next_due_at).getTime()<Date.now()?'overdue':'upcoming';
   const dueKind=new Date(s.next_due_at).getTime()<=Date.now()?'due':reminderKind;
   const kind=s.status==='overdue'?'overdue':dueKind;
   const recipients=[
     {userId:s.assigned_employee_id,familyId:null},
     {userId:s.assigned_manager_id,familyId:null},
     {userId:null,familyId:s.family_id}
   ];
   for(const recipient of recipients){
     const payload={scheduleId:s.schedule_id,familyId:s.family_id,memberId:s.member_id,requirementType:s.requirement_type,requirementCode:s.requirement_code,title:s.title,nextDueAt:s.next_due_at,documentType:s.document_type||null,documentValidUntil:s.valid_until||null};
     const row=await sql`INSERT INTO ycm_compliance_reminders(schedule_id,recipient_user_id,recipient_family_id,channel,reminder_kind,scheduled_for,payload)
       VALUES(${s.schedule_id},${recipient.userId},${recipient.familyId},'in_app',${kind},NOW(),${JSON.stringify(payload)}::jsonb)
       ON CONFLICT DO NOTHING RETURNING reminder_id`;
     if(row.length)created++;
   }
 }
 console.log(JSON.stringify({COMPLIANCE_REMINDER_WORKER:'PASS',schedules:schedules.length,remindersCreated:created}));
}finally{await sql.end({timeout:3});}
