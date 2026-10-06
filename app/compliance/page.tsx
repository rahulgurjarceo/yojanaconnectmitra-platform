'use client';

import { useEffect, useMemo, useState } from 'react';

type ComplianceRow = {
  schedule_id: string; family_id: string; requirement_type: 'document' | 'kyc'; requirement_code: string;
  title: string; status: string; next_due_at: string | null; warning_days: number; frequency_days: number | null;
  member_name: string | null; document_type: string | null; document_status: string | null;
  valid_from: string | null; valid_until: string | null; state_code: string | null; district_code: string | null;
  block_code: string | null; village_code: string | null;
};
type Session = { user?: { role?: string; familyId?: string } };
type ComplianceSummary = { total: number; due: number; overdue: number; completed: number; employees: Array<{ employeeId: string; total: number; due: number; overdue: number }> };

const statusLabel: Record<string, string> = { active: 'On track', due: 'Due soon', overdue: 'Overdue', completed: 'Completed', paused: 'Paused', cancelled: 'Cancelled' };
function statusClass(status: string) {
  if (status === 'overdue') return 'bg-red-100 text-red-700';
  if (status === 'due') return 'bg-amber-100 text-amber-700';
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

export default function CompliancePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const sr = await fetch('/api/auth/session', { cache: 'no-store' });
      const s = await sr.json();
      if (!sr.ok) throw new Error(s.code || 'AUTHENTICATION_REQUIRED');
      setSession(s);
      const familyId = s.user?.role === 'family' ? s.user?.familyId : null;
      const url = familyId ? '/api/compliance/requirements?familyId=' + encodeURIComponent(familyId) : '/api/compliance/requirements';
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.code || 'COMPLIANCE_UNAVAILABLE');
      setRows(j.schedules || []); setSummary(j.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'COMPLIANCE_UNAVAILABLE');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => filter === 'all' ? rows : rows.filter(r => r.status === filter), [rows, filter]);
  const counts = {
    all: rows.length, due: rows.filter(r => r.status === 'due').length,
    overdue: rows.filter(r => r.status === 'overdue').length, completed: rows.filter(r => r.status === 'completed').length,
  };
  const role = session?.user?.role || '';
  const title = role === 'family' ? 'My Compliance & KYC' : role === 'branch_manager' ? 'Branch Compliance Center' : 'Compliance & KYC Center';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-5 py-7">
        <div className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">YCM ONE • COMPLIANCE</div>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div><h1 className="text-3xl font-black md:text-4xl">{title}</h1><p className="mt-2 max-w-3xl text-sm text-slate-300">Service, document validity, application deadline और KYC due dates एक जगह — database-driven rules के आधार पर.</p></div>
          <button onClick={() => void load()} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold">Refresh</button>
        </div>
      </div></header>

      <section className="mx-auto max-w-7xl px-5 py-7">
        {error ? <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[['All', counts.all, 'all'], ['Due soon', counts.due, 'due'], ['Overdue', counts.overdue, 'overdue'], ['Completed', counts.completed, 'completed']].map(([label, count, value]) => (
            <button key={String(value)} onClick={() => setFilter(String(value))} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${filter === value ? 'border-cyan-400 ring-2 ring-cyan-100' : 'border-slate-200'}`}>
              <div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-3xl font-black">{count}</div>
            </button>
          ))}
        </div>

        {role === 'branch_manager' && summary ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[['Branch total', summary.total], ['Due soon', summary.due], ['Overdue', summary.overdue], ['Completed', summary.completed]].map(([label, count]) => (
              <div key={String(label)} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{count}</div></div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Compliance queue</h2><p className="mt-1 text-sm text-slate-500">Validity और KYC rules बदलने पर frontend बदलने की जरूरत नहीं है.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">Role: {role || '—'}</span></div>
          {loading ? <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Loading compliance records…</div> : null}
          {!loading && !filtered.length ? <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No compliance records for this view.</div> : null}
          <div className="mt-5 space-y-3">
            {filtered.map(row => (
              <article key={row.schedule_id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700">{row.requirement_type.toUpperCase()}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(row.status)}`}>{statusLabel[row.status] || row.status}</span>
                    {row.document_type ? <span className="text-xs text-slate-500">Document: {row.document_type}</span> : null}
                  </div>
                  <h3 className="mt-2 font-black">{row.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">Code: {row.requirement_code} • Family: {row.family_id}{row.member_name ? ` • Member: ${row.member_name}` : ''}</p>
                  {row.document_status ? <p className="mt-1 text-xs text-slate-500">Document status: {row.document_status}</p> : null}</div>
                  <div className="shrink-0 rounded-2xl bg-slate-50 p-4 lg:min-w-56"><div className="text-xs font-bold text-slate-500">Next due</div><div className="mt-1 font-black">{row.next_due_at ? new Date(row.next_due_at).toLocaleDateString('en-IN') : '—'}</div>
                    {row.valid_until ? <div className="mt-1 text-xs text-slate-500">Valid until: {new Date(row.valid_until).toLocaleDateString('en-IN')}</div> : null}
                    {row.warning_days != null ? <div className="mt-1 text-xs text-slate-500">Warning window: {row.warning_days} days</div> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
