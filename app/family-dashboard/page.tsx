'use client';

import { useEffect, useState } from 'react';

type DashboardData = { family: { familyId: string; status: string; fullName: string; mobile: string; country: string; createdAt: string; updatedAt: string; modules: string[] } };
type ResourceData = { cases: any[]; documents: any[]; consents: any[]; cri: any[] };

export default function FamilyDashboardPage() {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: DashboardData; resources?: ResourceData }>({ loading: true });
  useEffect(() => {
    (async () => {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error('AUTHENTICATION_REQUIRED');
      const session = await sessionResponse.json();
      const familyId = session.user?.familyId;
      if (session.user?.role !== 'family' || !familyId) throw new Error('FORBIDDEN_ROLE_SCOPE');
      const [dashboardResponse, resourcesResponse] = await Promise.all([
        fetch(`/api/family-dashboard?familyId=${encodeURIComponent(familyId)}`, { cache: 'no-store' }),
        fetch(`/api/family-dashboard/resources-v2?familyId=${encodeURIComponent(familyId)}`, { cache: 'no-store' }),
      ]);
      const dashboard = await dashboardResponse.json();
      const resources = await resourcesResponse.json();
      if (!dashboardResponse.ok) throw new Error(dashboard.code || 'DASHBOARD_ACCESS_DENIED');
      if (!resourcesResponse.ok) throw new Error(resources.code || 'FAMILY_RESOURCES_UNAVAILABLE');
      setState({ loading: false, data: dashboard, resources: resources.resources });
    })().catch(error => setState({ loading: false, error: error instanceof Error ? error.message : 'DASHBOARD_ACCESS_DENIED' }));
  }, []);
  if (state.loading) return <main className="min-h-screen bg-slate-950 p-8 text-white">Verifying Family access…</main>;
  if (state.error) return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-400/5 p-8"><h1 className="text-2xl font-black">Access denied</h1><p className="mt-2 text-slate-300">Only the authenticated Family owner can access this Family 360 data.</p><p className="mt-4 text-xs text-red-300">{state.error}</p></div></main>;
  const family = state.data!.family;
  const resources = state.resources!;
  const cards = [['Cases', resources.cases.length, 'case tracking'], ['Documents', resources.documents.length, 'metadata only; no raw Aadhaar'], ['Consents', resources.consents.length, 'consent ledger'], ['CRI / CSAT', resources.cri.length, 'outcome and service quality']];
  return <main className="min-h-screen bg-slate-950 px-5 py-10 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">YCM ONE • Family 360</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black">Family Dashboard</h1><p className="mt-2 text-slate-400">Private family scope: {family.familyId}</p></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Verified session</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">Family</p><p className="mt-1 text-xl font-bold">{family.fullName}</p><p className="mt-1 text-sm text-slate-400">{family.mobile} • {family.country}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">Account status</p><p className="mt-1 text-xl font-bold capitalize">{family.status}</p><p className="mt-1 text-sm text-slate-400">Persisted Family 360 record</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([name,count,desc]) => <section key={String(name)} className="rounded-3xl border border-white/10 bg-white/5 p-6"><p className="text-sm text-slate-400">{name}</p><p className="mt-2 text-3xl font-black">{count}</p><p className="mt-2 text-xs text-slate-500">{desc}</p></section>)}</div><div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6"><h2 className="text-xl font-black">Family services</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{family.modules.map(module => <div key={module} className="rounded-2xl border border-white/10 p-4"><p className="font-bold capitalize">{module.replaceAll('-', ' ')}</p><p className="mt-1 text-xs text-slate-500">Authenticated family scope only</p></div>)}</div></div></div></main>;
}
