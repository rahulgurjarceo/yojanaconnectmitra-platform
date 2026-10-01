import { LEGAL_PRACTICE_AREAS, LEGAL_SOURCE_CATALOG } from "../legal-source-catalog";

export default function LegalKnowledgePage() {
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <div className="text-sm font-semibold tracking-[.2em] text-indigo-600">YCM ONE • LEGAL MITRA</div>
        <h1 className="mt-2 text-3xl font-bold">Legal Knowledge Hub</h1>
        <p className="mt-2 max-w-3xl text-slate-600">India-first, jurisdiction-aware legal source map. The AI should prefer primary/official sources and show the source, jurisdiction and verification date.</p>
      </div>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">Authoritative Sources</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LEGAL_SOURCE_CATALOG.map(s => <article key={s.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{s.name}</h3><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{s.priority}</span></div>
            <p className="mt-1 text-xs text-slate-500">{s.authority} • {s.jurisdiction}</p>
            <div className="mt-3 flex flex-wrap gap-2">{s.scope.map(x => <span key={x} className="rounded-full bg-slate-100 px-2 py-1 text-xs">{x}</span>)}</div>
            <a className="mt-4 inline-block text-sm font-semibold text-indigo-600" href={s.url} target="_blank" rel="noreferrer">Official source ↗</a>
          </article>)}
        </div>
      </section>
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">Practice Areas</h2>
        <div className="mt-4 flex flex-wrap gap-2">{LEGAL_PRACTICE_AREAS.map(x => <span key={x} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">{x}</span>)}</div>
      </section>
    </div>
  </main>;
}
