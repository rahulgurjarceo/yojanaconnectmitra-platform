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

const nextStatus: Record<Assignment['status'], Assignment['status']> = {
  assigned: 'accepted',
  accepted: 'in_progress',
  in_progress: 'completed',
  blocked: 'in_progress',
  completed: 'completed',
  reassigned: 'accepted'
};

export default function Page() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [busy, setBusy] = useState('');

  async function loadTasks() {
    const response = await fetch('/api/work-assignments?mine=true', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.code || 'TASKS_LOAD_FAILED');
    setTasks(data.assignments || []);
  }

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.user?.role !== 'employee') throw new Error('FORBIDDEN_ROLE_SCOPE');
        setOk(true);
        await loadTasks();
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
        <div className="mx-auto max-w-6xl px-5 py-5">
          <div className="text-sm font-bold text-blue-700">YCM ONE</div>
          <h1 className="mt-1 text-3xl font-black">🧑‍💼 Employee / Mitra Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">Assigned work → accept → execute → complete.</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        {error ? <div className="mb-5 rounded-2xl bg-red-50 p-5 text-red-700">{error}</div> : null}
        {!ok ? (
          <div className="rounded-2xl bg-white p-5">Loading secure workspace…</div>
        ) : (
          <>
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
                  <h2 className="text-xl font-black">My Work Queue</h2>
                  <p className="mt-1 text-sm text-slate-500">Live assignments from CRM / Family 360.</p>
                </div>
                <button onClick={() => loadTasks().catch((e) => setError(e instanceof Error ? e.message : 'TASKS_LOAD_FAILED'))} className="rounded-xl border px-4 py-2 text-sm font-bold">Refresh</button>
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
                      <button
                        disabled={busy === task.assignment_id || task.status === 'completed'}
                        onClick={() => advance(task)}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                      >
                        {task.status === 'assigned' ? 'Accept' : task.status === 'accepted' ? 'Start' : task.status === 'in_progress' ? 'Complete' : task.status === 'blocked' ? 'Resume' : 'Completed'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['👥', 'Customers', 'Assigned customer records'],
                ['📁', 'Cases', 'Assigned cases and status'],
                ['📄', 'Documents', 'Customer document workflows'],
                ['📊', 'Performance', 'Work completion and operational metrics']
              ].map(([icon, title, description]) => (
                <div key={title} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="text-2xl">{icon}</div>
                  <h2 className="mt-3 font-black">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
