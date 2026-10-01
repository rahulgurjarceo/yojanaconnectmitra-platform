'use client';
import { useMemo, useState } from "react";
import { YCM_SERVICE_CATALOG, YCM_SERVICE_MODULES, YCM_SERVICE_STATS } from "../service-catalog";

export default function ServicesPage() {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("All");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return YCM_SERVICE_CATALOG.filter((s) => {
      const moduleMatch = module === "All" || s.module === module;
      const queryMatch = !q || `${s.name} ${s.module} ${s.audience.join(" ")}`.toLowerCase().includes(q);
      return moduleMatch && queryMatch;
    });
  }, [query, module]);
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b bg-white"><div className="mx-auto max-w-7xl px-5 py-5">
      <div className="text-2xl font-black text-blue-700">YCM ONE — Service Centre</div>
      <p className="mt-1 text-sm text-slate-500">One platform, many service verticals. Official-source verification is required before application or payment.</p>
    </div></header>
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm"><b className="text-3xl">{YCM_SERVICE_STATS.modules}</b><p className="text-sm text-slate-500">service modules</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm"><b className="text-3xl">{YCM_SERVICE_STATS.services}</b><p className="text-sm text-slate-500">catalogue services</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm"><b className="text-lg">India-first</b><p className="text-sm text-slate-500">jurisdiction-aware architecture</p></div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_280px]">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agriculture, scholarship, loan, document, insurance..." className="rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300" />
        <select value={module} onChange={(e) => setModule(e.target.value)} className="rounded-2xl border bg-white px-4 py-3">
          <option>All</option>{YCM_SERVICE_MODULES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((service) => <article key={`${service.module}-${service.id}`} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-700">{service.module}</div>
          <h2 className="mt-2 font-extrabold">{service.name}</h2>
          <p className="mt-2 text-xs text-slate-500">{service.audience.join(" • ")}</p>
          <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{service.kind}</span>
        </article>)}
      </div>
      {!filtered.length && <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">No service found.</div>}
    </section>
  </main>;
}
