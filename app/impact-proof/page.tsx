'use client';

import { useMemo, useState } from 'react';

type Scope = 'state' | 'district' | 'block';

const demo = {
  state: { label: 'Rajasthan', families: 0, cases: 0, verified: 0, enrollments: 0, improvements: 0, scholarship: 0, employment: 0, skills: 0, services: 0 },
  district: { label: 'Select district', families: 0, cases: 0, verified: 0, enrollments: 0, improvements: 0, scholarship: 0, employment: 0, skills: 0, services: 0 },
  block: { label: 'Select block', families: 0, cases: 0, verified: 0, enrollments: 0, improvements: 0, scholarship: 0, employment: 0, skills: 0, services: 0 },
};

export default function ImpactProofPage() {
  const [scope, setScope] = useState<Scope>('state');
  const [period, setPeriod] = useState('2026-09-01');
  const [block, setBlock] = useState('');
  const data = useMemo(() => demo[scope], [scope]);

  const cards = [
    ['Families served', data.families],
    ['Cases completed', data.cases],
    ['Verified outcomes', data.verified],
    ['Education enrollments', data.enrollments],
    ['Education improvements', data.improvements],
    ['Scholarship access', data.scholarship],
    ['Employment outcomes', data.employment],
    ['Skill completions', data.skills],
    ['Govt services completed', data.services],
  ];

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">YCM ONE • IMPACT & PROOF</div>
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><h1 className="text-3xl font-black md:text-5xl">Impact & Evidence Dashboard</h1>
          <p className="mt-2 max-w-3xl text-slate-300">State → District → Block evidence of measurable outcomes after YCM intervention.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm"><b>Evidence standard</b><div className="text-slate-400">Baseline → intervention → follow-up → verification</div></div>
        </div>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 py-7">
      <div className="rounded-3xl border bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {(['state','district','block'] as Scope[]).map(x => <button key={x} onClick={() => setScope(x)} className={`rounded-full border px-4 py-2 text-sm font-black ${scope === x ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{x === 'state' ? 'State' : x === 'district' ? 'District' : 'Block'}</button>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select className="rounded-xl border bg-white px-3 py-3 text-sm font-semibold"><option>Rajasthan</option></select>
          <select className="rounded-xl border bg-white px-3 py-3 text-sm font-semibold"><option>{scope === 'block' ? 'Select district' : 'All districts'}</option></select>
          <select value={block} onChange={e => setBlock(e.target.value)} className="rounded-xl border bg-white px-3 py-3 text-sm font-semibold"><option value="">All blocks</option><option value="sample">Block data will appear after verified records are connected</option></select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="font-bold text-slate-600">Period from <input type="date" value={period} onChange={e => setPeriod(e.target.value)} className="ml-2 rounded-xl border px-3 py-2 font-normal"/></label>
          <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Live evidence connection pending</span>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <div className="text-xs font-black uppercase tracking-wider text-blue-700">Government proof rule</div>
        <p className="mt-2 text-sm leading-6 text-blue-950">YCM will count an improvement only when baseline and follow-up measurements are linked to the same intervention/case and supported by a permitted evidence source. The dashboard must not convert correlation into a causal claim automatically.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label,value]) => <div key={String(label)} className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div><div className="mt-1 text-xs text-slate-400">Verified records only</div></div>)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border bg-white p-6">
          <div className="text-xs font-black uppercase tracking-wider text-blue-700">Education improvement proof</div>
          <h2 className="mt-2 text-2xl font-black">Baseline → Follow-up</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Baseline</div><div className="mt-1 text-2xl font-black">—</div></div>
            <div className="rounded-2xl bg-blue-50 p-4"><div className="text-xs text-blue-600">Follow-up</div><div className="mt-1 text-2xl font-black">—</div></div>
            <div className="rounded-2xl bg-emerald-50 p-4"><div className="text-xs text-emerald-700">Change</div><div className="mt-1 text-2xl font-black">—</div></div>
          </div>
          <p className="mt-4 text-sm text-slate-500">No improvement figure is fabricated. Once assessment records are connected, the system will calculate the change automatically.</p>
        </section>

        <section className="rounded-3xl border bg-white p-6">
          <div className="text-xs font-black uppercase tracking-wider text-blue-700">Evidence packet</div>
          <h2 className="mt-2 text-2xl font-black">Government-ready report</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>✓ Reporting period and geography</div><div>✓ Methodology version</div><div>✓ Output vs verified outcome separation</div><div>✓ Baseline/follow-up evidence references</div><div>✓ Consent/privacy statement</div><div>✓ Verification and audit timestamp</div>
          </div>
          <button disabled className="mt-5 w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-black text-slate-500">Generate Evidence Packet — connect verified data first</button>
        </section>
      </div>

      <section className="mt-6 rounded-3xl bg-slate-950 p-6 text-white">
        <div className="text-xs font-black uppercase tracking-wider text-cyan-300">Implementation status</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {['Impact data contract ✓','Dashboard UI ✓','Evidence methodology ✓','Production DB/API → next'].map(x => <div key={x} className="rounded-2xl bg-white/10 p-4 text-sm font-bold">{x}</div>)}
        </div>
      </section>
    </section>
  </main>;
}
