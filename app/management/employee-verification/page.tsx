'use client';

import { useEffect, useState } from 'react';

type Verification = {
  verification_id: string;
  user_id: string;
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  test_score: number | null;
  test_passed_at: string | null;
  training_completed_at: string | null;
  verified_at: string | null;
  notes: string | null;
  updated_at: string;
  user_role?: string;
  user_status?: string;
};

type VerificationEvent = {
  event_id: string;
  event_type: string;
  score: number | null;
  details: Record<string, unknown> | null;
  actor_user_id: string;
  created_at: string;
};

const statuses: Verification['status'][] = ['pending', 'verified', 'suspended', 'rejected'];

export default function EmployeeVerificationPage() {
  const [rows, setRows] = useState<Verification[]>([]);
  const [filter, setFilter] = useState<'all' | Verification['status']>('all');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState<Record<string, VerificationEvent[]>>({});
  const [eventsBusy, setEventsBusy] = useState('');

  async function load() {
    const response = await fetch('/api/employee/verification', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.code || 'VERIFICATION_LOAD_FAILED');
    setRows(data.verifications || []);
  }

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'VERIFICATION_LOAD_FAILED')); }, []);

  async function loadEvents(userId: string) {
    setEventsBusy(userId);
    setError('');
    try {
      const response = await fetch(`/api/employee/verification?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.code || 'VERIFICATION_EVENTS_LOAD_FAILED');
      setEvents((current) => ({ ...current, [userId]: data.events || [] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VERIFICATION_EVENTS_LOAD_FAILED');
    } finally {
      setEventsBusy('');
    }
  }

  async function setStatus(userId: string, status: Verification['status']) {
    setBusy(userId);
    setError('');
    try {
      const response = await fetch('/api/employee/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.code || 'VERIFICATION_UPDATE_FAILED');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VERIFICATION_UPDATE_FAILED');
    } finally {
      setBusy('');
    }
  }

  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="text-sm font-bold text-blue-700">YCM ONE · HR / GOVERNANCE</div>
          <h1 className="mt-1 text-3xl font-black">Employee Verification & Vetting</h1>
          <p className="mt-1 text-sm text-slate-500">Manager-controlled verification status, training/test evidence and review trail.</p>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        {error ? <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
        <div className="mb-5 flex flex-wrap gap-2">
          {(['all', ...statuses] as const).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-black ${filter === value ? 'bg-slate-950 text-white' : 'border bg-white'}`}>
              {value === 'all' ? 'All' : value}
            </button>
          ))}
          <button onClick={() => load().catch((e) => setError(e instanceof Error ? e.message : 'REFRESH_FAILED'))} className="ml-auto rounded-xl border bg-white px-4 py-2 text-sm font-black">Refresh</button>
        </div>
        <div className="space-y-4">
          {visible.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">No employee verification records found.</div> : visible.map((row) => (
            <article key={row.verification_id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black">{row.user_id}</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{row.status}</span>
                    {row.user_status ? <span className="text-xs text-slate-500">account: {row.user_status}</span> : null}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">Test: <b>{row.test_score ?? '—'}</b> · Training: <b>{row.training_completed_at ? 'completed' : 'pending'}</b> · Verified: <b>{row.verified_at ? new Date(row.verified_at).toLocaleString('en-IN') : '—'}</b></div>
                  {row.notes ? <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm">{row.notes}</div> : null}
                  {events[row.user_id] ? (
                    <div className="mt-3 rounded-xl border bg-slate-50 p-3">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-500">Verification audit trail</div>
                      <div className="mt-2 space-y-2">
                        {events[row.user_id].length === 0 ? <div className="text-xs text-slate-500">No audit events.</div> : events[row.user_id].map((event) => (
                          <div key={event.event_id} className="rounded-lg bg-white p-2 text-xs">
                            <div className="font-black">{event.event_type} · {event.score ?? '—'}</div>
                            <div className="text-slate-500">{new Date(event.created_at).toLocaleString('en-IN')} · actor: {event.actor_user_id}</div>
                            {typeof event.details?.notes === 'string' ? <div className="mt-1 text-slate-700">{event.details.notes}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => loadEvents(row.user_id)} disabled={eventsBusy === row.user_id} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-40">
                    {eventsBusy === row.user_id ? 'Loading audit…' : events[row.user_id] ? 'Refresh audit' : 'View audit'}
                  </button>
                  {statuses.filter((status) => status !== row.status).map((status) => (
                    <button key={status} disabled={busy === row.user_id} onClick={() => setStatus(row.user_id, status)} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-40">
                      {busy === row.user_id ? 'Saving…' : `Set ${status}`}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
