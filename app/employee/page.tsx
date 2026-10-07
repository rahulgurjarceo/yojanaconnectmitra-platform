'use client';

import { useEffect, useState } from 'react';

type Assignment = {
  assignment_id: string;
  family_id: string;
  source_type: string;
  source_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'assigned' | 'accepted' | 'in_progress' | 'blocked' | 'completed' | 'reassigned';
  reason: string | null;
  due_at: string | null;
  updated_at: string;
};

type ComplianceItem = {
  requirementType: string;
  code: string | null;
  title: string | null;
  status: string;
  nextDueAt: string | null;
  warningDays: number | null;
  memberId: string | null;
  documentType: string | null;
  validFrom: string | null;
  validUntil: string | null;
  verifiedAt: string | null;
};

type Lead = {
  lead_id: string;
  family_id: string | null;
  name: string;
  mobile: string | null;
  need_text: string | null;
  service_code: string | null;
  service_name: string | null;
  status: string;
  next_follow_up_at: string | null;
  compliance_due_count: number;
  compliance_overdue_count: number;
  next_compliance_due_at: string | null;
  compliance_items: ComplianceItem[];
};

const nextStatus: Record<Assignment['status'], Assignment['status']> = {
  assigned: 'accepted',
  accepted: 'in_progress',
  in_progress: 'completed',
  blocked: 'in_progress',
  completed: 'completed',
  reassigned: 'accepted'
};

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function complianceLabel(item: ComplianceItem) {
  if (item.status === 'overdue') return 'Overdue';
  if (item.status === 'due') return 'Due';
  if (item.status === 'completed') return 'Completed';
  return item.documentType || item.title || item.code || item.requirementType;
}

export default function Page() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busy, setBusy] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [profileBusy, setProfileBusy] = useState('');
  const [verification, setVerification] = useState<any>(null);

  async function loadVerification() {
    const response = await fetch('/api/employee/verification', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.code || 'VERIFICATION_LOAD_FAILED');
    setVerification(data.verification || null);
  }

  async function loadTasks() {
    const response = await fetch('/api/work-assignments?mine=true', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.code || 'TASKS_LOAD_FAILED');
    setTasks(data.assignments || []);
  }

  async function loadProfile(familyId: string) {
    setProfileBusy(familyId);
    try {
      const response = await fetch(`/api/crm/customer-profile?familyId=${encodeURIComponent(familyId)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.code || 'PROFILE_LOAD_FAILED');
      setProfiles((current) => ({ ...current, [familyId]: data.profile }));
    } catch (e) { setError(e instanceof Error ? e.message : 'PROFILE_LOAD_FAILED'); }
    finally { setProfileBusy(''); }
  }

  async function loadLeads() {
    const response = await fetch('/api/crm/leads', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.code || 'CRM_LOAD_FAILED');
    setLeads(data.leads || []);
  }

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.user?.role !== 'employee') throw new Error('FORBIDDEN_ROLE_SCOPE');
        setOk(true);
        await Promise.all([loadTasks(), loadLeads(), loadVerification()]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'ACCESS_DENIED'));
  }, []);

  async function advance(task: Assignment) {
    const status = nextStatus[task.status];
    if (status === task.status) return;
    setBusy(task.assignment_id);
    try {
      const response = await fetch('/api/work-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: task.assignment_id, status })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.code || 'TASK_UPDATE_FAILED');
      await loadTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'TASK_UPDATE_FAILED');
    } finally {
      setBusy('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5">
          <div className="text-sm font-bold text-blue-700">YCM ONE · CRM</div>
          <h1 className="mt-1 text-3xl font-black">🧑‍💼 Employee / Mitra Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">Assigned work, customer calling, verified documents and renewal/KYC follow-up in one place.</p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {error ? <div className="mb-5 rounded-2xl bg-red-50 p-5 text-red-700">{error}</div> : null}
        {!ok ? (
          <div className="rounded-2xl bg-white p-5">Loading secure workspace…</div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="text-sm font-bold text-slate-500">Employee verification</div><div className="mt-1 text-xl font-black">{verification?.status ? verification.status.toUpperCase() : 'PENDING REVIEW'}</div></div>
                <div className="text-sm text-slate-500">Test score: <span className="font-black text-slate-900">{verification?.test_score ?? '—'}</span> · Training: <span className="font-black text-slate-900">{verification?.training_completed_at ? 'Completed' : 'Pending'}</span></div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['assigned', 'accepted', 'in_progress', 'blocked'] as const).map((status) => (
                <div key={status} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">{status.replace('_', ' ')}</div>
                  <div className="mt-1 text-3xl font-black">{tasks.filter((task) => task.status === status).length}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">📞 Calling & Compliance CRM</h2>
                  <p className="mt-1 text-sm text-slate-500">Only leads assigned to this employee are shown. Use the verified compliance status to decide who needs a call.</p>
                </div>
                <button onClick={() => Promise.all([loadTasks(), loadLeads()]).catch((e) => setError(e instanceof Error ? e.message : 'CRM_REFRESH_FAILED'))} className="rounded-xl border px-4 py-2 text-sm font-bold">Refresh</button>
              </div>

              <div className="mt-5 space-y-4">
                {leads.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">No assigned CRM leads right now.</div>
                ) : leads.map((lead) => (
                  <article key={lead.lead_id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black">{lead.name}</h3>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{lead.status}</span>
                          {lead.service_code ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{lead.service_code}</span> : null}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{lead.mobile || 'No mobile'} · {lead.need_text || 'Service assistance'}</div>
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                          <div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Due</span><div className="font-black">{lead.compliance_due_count}</div></div>
                          <div className="rounded-xl bg-red-50 p-3 text-red-700"><span>Overdue</span><div className="font-black">{lead.compliance_overdue_count}</div></div>
                          <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><span>Next follow-up</span><div className="font-black">{dateLabel(lead.next_compliance_due_at)}</div></div>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-xl border px-4 py-3 text-sm">
                        <div className="font-bold">Next call</div>
                        <div className="text-slate-500">{dateLabel(lead.next_follow_up_at)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {lead.family_id ? <button onClick={() => loadProfile(lead.family_id!)} disabled={profileBusy === lead.family_id} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-40">{profileBusy === lead.family_id ? 'Loading 360…' : 'Open Customer 360'}</button> : null}
                      {lead.mobile ? <a href={`tel:${lead.mobile}`} className="rounded-xl border px-3 py-2 text-xs font-black">Call customer</a> : null}
                    </div>
                    {lead.family_id && profiles[lead.family_id] ? <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-500">Customer 360 · Jobs / Schemes / Forms / Preparation</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {(profiles[lead.family_id].opportunities || []).length === 0 ? <div className="text-sm text-slate-500">No opportunity/form record yet.</div> : (profiles[lead.family_id].opportunities || []).map((op: any) => <div key={op.opportunity_id} className="rounded-xl border bg-white p-3">
                          <div className="flex items-center justify-between gap-2"><b>{op.title}</b><span className="text-[11px] font-bold text-blue-700">{op.opportunity_type}</span></div>
                          <div className="mt-1 text-xs text-slate-500">{op.organization || 'YCM opportunity'} · Deadline: {dateLabel(op.application_deadline_at)}</div>
                          {op.preparation_notes ? <div className="mt-2 text-sm"><b>Preparation:</b> {op.preparation_notes}</div> : null}
                          {op.form_url ? <a className="mt-2 inline-block text-xs font-black text-blue-700 underline" href={op.form_url} target="_blank" rel="noreferrer">Open form</a> : null}
                        </div>)}
                      </div>
                      <div className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">Employee Notes</div>
                      <div className="mt-2 space-y-2">{(profiles[lead.family_id].notes || []).map((n: any) => <div key={n.note_id} className="rounded-xl border bg-white p-3 text-sm"><b>{n.title}</b><div className="mt-1 text-slate-600">{n.content}</div></div>)}</div>
                      <div className="mt-3 text-xs text-slate-500">Controlled sharing is recorded through the CRM profile API; customer-facing shares should contain only the selected form/opportunity/note payload.</div>
                    </div> : null}

                    <div className="mt-4">
                      <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Verified compliance snapshot</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {lead.compliance_items.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No compliance requirement recorded yet.</div>
                        ) : lead.compliance_items.map((item, index) => (
                          <div key={item.code || item.documentType || item.title || index} className="rounded-xl border bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-bold">{item.documentType || item.title || item.code || 'Compliance requirement'}</div>
                              <span className={`rounded-full px-2 py-1 text-[11px] font-black ${item.status === 'overdue' ? 'bg-red-100 text-red-700' : item.status === 'due' ? 'bg-amber-100 text-amber-700' : item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{complianceLabel(item)}</span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                              <div>Valid until <b className="text-slate-800">{dateLabel(item.validUntil)}</b></div>
                              <div>Next due <b className="text-slate-800">{dateLabel(item.nextDueAt)}</b></div>
                            </div>
                            {item.title && item.documentType ? <div className="mt-1 text-xs text-slate-500">{item.title}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-black">My Work Queue</h2>
                <p className="mt-1 text-sm text-slate-500">Live assignments from CRM / Family 360.</p>
              </div>
              <div className="mt-5 space-y-3">
                {tasks.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">No assignments right now.</div>
                ) : tasks.map((task) => (
                  <article key={task.assignment_id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{task.source_type}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{task.priority}</span>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{task.status.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-2 font-bold">Family: {task.family_id}</div>
                        <div className="text-sm text-slate-500">{task.reason || 'Assigned service work'}</div>
                        {task.due_at ? <div className="mt-1 text-xs text-slate-400">Due: {new Date(task.due_at).toLocaleString()}</div> : null}
                      </div>
                      <button disabled={busy === task.assignment_id || task.status === 'completed'} onClick={() => advance(task)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
                        {task.status === 'assigned' ? 'Accept' : task.status === 'accepted' ? 'Start' : task.status === 'in_progress' ? 'Complete' : task.status === 'blocked' ? 'Resume' : 'Completed'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
