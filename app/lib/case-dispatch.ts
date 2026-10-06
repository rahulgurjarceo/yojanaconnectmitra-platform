import postgres from 'postgres';

type DispatchResult = {
  caseId: string;
  teamId: string;
  teamName: string;
  assignedTo?: string | null;
  assignmentId?: string;
  dueAt?: unknown;
  reused: boolean;
};

export async function dispatchCase(caseId: string, actorRef?: string): Promise<DispatchResult> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw Object.assign(new Error('DATABASE_NOT_CONFIGURED'), { code: 'DATABASE_NOT_CONFIGURED' });
  const sql = postgres(url, { max: 4, prepare: false, connect_timeout: 10, idle_timeout: 20 });
  try {
    return await sql.begin(async tx => {
      const c = (await tx`SELECT c.case_id,c.family_id,c.application_id,c.status,c.priority,c.due_at,
          f.state_code,f.district_code,f.block_code,f.gram_panchayat_code,f.village_code,
          a.service_code
        FROM ycm_family_cases c
        JOIN ycm_families f ON f.family_id=c.family_id
        LEFT JOIN ycm_service_applications a ON a.application_id=c.application_id
        WHERE c.case_id=${caseId} LIMIT 1`)[0] as Record<string, unknown> | undefined;
      if (!c) throw Object.assign(new Error('CASE_NOT_FOUND'), { code: 'CASE_NOT_FOUND' });
      if (['completed','closed','cancelled'].includes(String(c.status))) throw Object.assign(new Error('CASE_NOT_DISPATCHABLE'), { code: 'CASE_NOT_DISPATCHABLE' });

      const serviceCode = c.service_code ? String(c.service_code) : null;
      const service = serviceCode
        ? (await tx`SELECT service_code,business_domain_code FROM ycm_service_master WHERE service_code=${serviceCode} LIMIT 1`)[0]
        : null;
      const domainCode = service?.business_domain_code || null;
      const stateCode = c.state_code || null;
      const districtCode = c.district_code || null;
      const blockCode = c.block_code || null;

      const rules = await tx`SELECT r.rule_id,r.team_id,r.sla_minutes,r.priority,t.name AS team_name,t.manager_user_id
        FROM ycm_case_routing_rules r
        JOIN ycm_teams t ON t.team_id=r.team_id AND t.status='active'
        WHERE r.active=true
          AND ((r.service_code IS NOT NULL AND r.service_code=${serviceCode})
            OR (r.business_domain_code IS NOT NULL AND r.business_domain_code=${domainCode}))
          AND (r.state_code IS NULL OR r.state_code=${stateCode})
          AND (r.district_code IS NULL OR r.district_code=${districtCode})
          AND (r.block_code IS NULL OR r.block_code=${blockCode})
        ORDER BY CASE WHEN r.service_code IS NOT NULL AND r.service_code=${serviceCode} THEN 0 ELSE 1 END,
          CASE WHEN r.block_code IS NOT NULL AND r.block_code=${blockCode} THEN 0
          WHEN r.district_code IS NOT NULL AND r.district_code=${districtCode} THEN 1
          WHEN r.state_code IS NOT NULL AND r.state_code=${stateCode} THEN 2 ELSE 3 END,
          r.priority DESC,r.team_id,r.rule_id
        `;
      // A team may have multiple matching rules; routing is to the team, so
      // collapse duplicate team matches before load balancing.
      const candidatesByTeam = new Map<string, any>();
      for (const rule of rules as any[]) {
        if (!rule.manager_user_id) continue;
        const key = String(rule.team_id);
        if (!candidatesByTeam.has(key)) candidatesByTeam.set(key, rule);
      }
      const candidates = [...candidatesByTeam.values()];

      if (!candidates.length) {
        const fallback = (await tx`SELECT t.team_id,t.name AS team_name,t.manager_user_id
          FROM ycm_teams t
          WHERE t.status='active' AND t.team_type='customer' AND t.manager_user_id IS NOT NULL
          ORDER BY t.team_id LIMIT 1`)[0];
        if (fallback) candidates.push({ ...fallback, sla_minutes: 1440, priority: 100, rule_id: null });
      }
      if (!candidates.length) throw Object.assign(new Error('NO_ROUTING_TEAM'), { code: 'NO_ROUTING_TEAM' });

      const managerIds = candidates.map(r => r.manager_user_id);
      const loadRows = await tx`SELECT assigned_to,COUNT(*)::int AS open_count
        FROM ycm_work_assignments
        WHERE status IN ('assigned','accepted','in_progress','blocked','reassigned')
          AND assigned_to IN ${tx(managerIds)}
        GROUP BY assigned_to`;
      const load = new Map((loadRows as any[]).map(r => [String(r.assigned_to), Number(r.open_count)]));
      candidates.sort((a,b) => {
        const loadDelta = (load.get(String(a.manager_user_id)) || 0) - (load.get(String(b.manager_user_id)) || 0);
        if (loadDelta !== 0) return loadDelta;
        return String(a.team_id).localeCompare(String(b.team_id));
      });

      const chosen = candidates[0];
      const dueAt = new Date(Date.now() + Number(chosen.sla_minutes || 1440) * 60000);
      const existing = (await tx`SELECT assignment_id,status FROM ycm_work_assignments
        WHERE case_id=${caseId} AND status NOT IN ('completed','reassigned')
        ORDER BY created_at DESC LIMIT 1`)[0];
      if (existing) {
        const existingTeam = (await tx`SELECT t.team_id,t.name AS team_name
          FROM ycm_work_assignments wa
          JOIN ycm_teams t ON t.team_id=wa.team_id
          WHERE wa.assignment_id=${existing.assignment_id} LIMIT 1`)[0];
        return {
          caseId,
          teamId: existingTeam?.team_id || chosen.team_id,
          teamName: existingTeam?.team_name || chosen.team_name,
          reused: true,
          assignmentId: existing.assignment_id
        };
      }

      const actor = actorRef ? ((await tx`SELECT id FROM ycm_users WHERE user_id=${actorRef} LIMIT 1`)[0]?.id || null) : null;
      const assignment = (await tx`INSERT INTO ycm_work_assignments
        (family_id,case_id,source_type,source_id,assigned_by,assigned_to,team_id,priority,status,reason,due_at)
        VALUES(${String(c.family_id)},${caseId},'case',${caseId},${actor},${chosen.manager_user_id},${chosen.team_id},${String(c.priority || 'normal')},'assigned','Deterministic case dispatch',${dueAt})
        RETURNING assignment_id,assigned_to,team_id,due_at`)[0];

      await tx`UPDATE ycm_family_cases SET assigned_to=${chosen.manager_user_id},due_at=${dueAt},updated_at=NOW() WHERE case_id=${caseId}`;
      await tx`INSERT INTO ycm_case_timeline
        (case_id,family_id,event_type,actor_type,actor_id,note,metadata)
        VALUES(${caseId},${String(c.family_id)},'dispatched','system',${actorRef || 'system'},'Case automatically routed to the least-loaded eligible team lead',
          ${JSON.stringify({ teamId: chosen.team_id, teamName: chosen.team_name, assignmentId: assignment.assignment_id, slaMinutes: Number(chosen.sla_minutes || 1440), serviceCode, stateCode, districtCode, blockCode })}::jsonb)`;

      return { caseId, teamId: chosen.team_id, teamName: chosen.team_name, assignedTo: assignment.assigned_to, assignmentId: assignment.assignment_id, dueAt: assignment.due_at, reused: false };
    });
  } finally {
    await sql.end({ timeout: 3 });
  }
}
