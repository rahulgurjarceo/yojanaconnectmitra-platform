'use client';

import { useEffect, useState } from 'react';

type DashboardData = {
  family: {
    familyId: string;
    status: string;
    fullName: string;
    mobile: string;
    country: string;
    createdAt: string;
    updatedAt: string;
    modules: string[];
  };
};

export default function FamilyDashboardPage() {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: DashboardData }>({ loading: true });

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async sessionResponse => {
        if (!sessionResponse.ok) throw new Error('AUTHENTICATION_REQUIRED');
        const session = await sessionResponse.json();
        if (session.user?.role !== 'family' || !session.user.familyId) throw new Error('FORBIDDEN_ROLE_SCOPE');
        const dashboardResponse = await fetch(`/api/family-dashboard?familyId=${encodeURIComponent(session.user.familyId)}`, { cache: 'no-store' });
        const data = await dashboardResponse.json();
        if (!dashboardResponse.ok) throw new Error(data.code || 'DASHBOARD_ACCESS_DENIED');
        return data as DashboardData;
      })
      .then(data => setState({ loading: false, data }))
      .catch(error => setState({ loading: false, error: error instanceof Error ? error.message : 'DASHBOARD_ACCESS_DENIED' }));
  }, []);

  if (state.loading) return <main className="min-h-screen bg-slate-950 p-8 text-white">Verifying Family access…</main>;
  if (state.error) return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-400/5 p-8"><h1 className="text-2xl font-black">Access denied</h1><p className="mt-2 text-slate-300">This dashboard requires a verified Family session. Employees, partners, referrals and other roles cannot enter the Family dashboard.</p><p className="mt-4 text-xs text-red-300">{state.error}</p></div></main>;

  const family = state.data!.family;
  return <main className="min-h-screen bg-slate-950 px-5 py-10 text-white"><div className="mx-auto max-w-5xl"><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">YCM ONE • Family 360</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black">Family Dashboard</h1><p className="mt-2 text-slate-400">Private family scope: {family.familyId}</p></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Verified session</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">Family</p><p className="mt-1 text-xl font-bold">{family.fullName}</p><p className="mt-1 text-sm text-slate-400">{family.mobile} • {family.country}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">Account status</p><p className="mt-1 text-xl font-bold capitalize">{family.status}</p><p className="mt-1 text-sm text-slate-400">Persisted Family 360 record</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{family.modules.map(module => <section key={module} className="rounded-3xl border border-white/10 bg-white/5 p-6"><h2 className="font-bold capitalize">{module.replaceAll('-', ' ')}</h2><p className="mt-2 text-sm text-slate-400">Available only within this authenticated family scope.</p></section>)}</div></div></main>;
}
