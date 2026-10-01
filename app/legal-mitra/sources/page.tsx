import { LEGAL_SOURCES } from "../legal-sources";

export default function LegalSourcesPage() {
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <div className="text-sm font-semibold tracking-[.2em] text-indigo-600">YCM ONE • LEGAL MITRA</div>
        <h1 className="mt-2 text-3xl font-bold">Legal Sources</h1>
        <p className="mt-2 text-slate-600">Jurisdiction-aware reference library. Current official law must be checked before a legal answer is presented as current.</p>
      </div>
      {LEGAL_SOURCES.map(source => <section key={source.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">{source.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{source.publisher} • {source.edition} • {source.date}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {source.pages.map(p => <div key={p.section} className="rounded-2xl bg-slate-50 p-4">
            <div className="font-semibold">{p.section}</div>
            <div className="mt-1 text-sm text-slate-500">PDF page {p.page}</div>
          </div>)}
        </div>
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{source.warning}</div>
      </section>)}
    </div>
  </main>;
}
