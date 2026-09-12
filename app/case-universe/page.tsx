'use client';

import { useMemo, useState } from 'react';
import { CASE_UNIVERSE } from '../case-universe';

export default function CaseUniversePage() {
  const [query, setQuery] = useState('');
  const [pillar, setPillar] = useState('All');
  const pillars = ['All', ...Array.from(new Set(CASE_UNIVERSE.map(item => item.pillar)))];
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return CASE_UNIVERSE.filter(item =>
      (pillar === 'All' || item.pillar === pillar) &&
      (!q || `${item.name} ${item.description} ${item.pillar}`.toLowerCase().includes(q))
    );
  }, [query, pillar]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">YCM ONE</p>
            <h1 className="text-2xl font-black md:text-3xl">Case Universe</h1>
            <p className="mt-1 text-sm text-slate-500">India + International · {CASE_UNIVERSE.length} master domains</p>
          </div>
          <a href="/" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">← YCM Home</a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="max-w-3xl">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">ONE MASTER CASE TAXONOMY</span>
            <h2 className="mt-5 text-3xl font-black md:text-5xl">Every YCM case starts with the right domain.</h2>
            <p className="mt-4 leading-7 text-blue-100">The same master taxonomy can drive public search, Family 360, CRM lead capture, Mitra assignment, execution workflows, TAT and CRI reporting.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl">{CASE_UNIVERSE.length}</b><span className="text-sm text-blue-200">Master domains</span></div>
            <div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl">12</b><span className="text-sm text-blue-200">YCM ONE pillars</span></div>
            <div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl">2</b><span className="text-sm text-blue-200">Markets: India + International</span></div>
            <div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl">360°</b><span className="text-sm text-blue-200">Case lifecycle</span></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search domain, service area or pillar..." className="rounded-2xl border border-slate-200 bg-white px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <select value={pillar} onChange={e => setPillar(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold">
            {pillars.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
          <span>Showing <b className="text-slate-900">{filtered.length}</b> of {CASE_UNIVERSE.length} domains</span>
          <span className="font-semibold text-emerald-700">✓ Master taxonomy active</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, index) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl">{item.icon}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">#{String(CASE_UNIVERSE.indexOf(item) + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-4 text-lg font-black">{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">YCM ONE pillar: <span className="text-blue-700">{item.pillar}</span></div>
              <div className="mt-3 text-xs font-semibold text-slate-400">{item.scope} · Case routing ready</div>
            </article>
          ))}
        </div>

        {!filtered.length && <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No case domain matches your search.</div>}
      </section>
    </main>
  );
}
