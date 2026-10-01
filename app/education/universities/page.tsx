'use client';
import { useMemo, useState } from "react";
import { OPEN_UNIVERSITIES, UGC_DEB_DIRECTORY, UGC_UNIVERSITY_DIRECTORY } from "../education-universities";

export default function EducationUniversitiesPage(){
 const [q,setQ]=useState("");
 const rows=useMemo(()=>OPEN_UNIVERSITIES.filter(u=>!q||`${u.name} ${u.state} ${u.type}`.toLowerCase().includes(q.toLowerCase())),[q]);
 return <main className="min-h-screen bg-slate-50 text-slate-900">
  <header className="border-b bg-white"><div className="mx-auto max-w-7xl px-5 py-6">
   <div className="text-2xl font-black text-blue-700">YCM ONE — Universities & Open Education</div>
   <p className="mt-1 text-sm text-slate-500">UGC university directory + UGC-DEB ODL/Online programme verification.</p>
  </div></header>
  <section className="mx-auto max-w-7xl px-5 py-8">
   <div className="grid gap-4 sm:grid-cols-4">
    <div className="rounded-2xl bg-white p-5"><b className="text-2xl">57</b><p className="text-xs text-slate-500">Central Universities</p></div>
    <div className="rounded-2xl bg-white p-5"><b className="text-2xl">523</b><p className="text-xs text-slate-500">State Universities</p></div>
    <div className="rounded-2xl bg-white p-5"><b className="text-2xl">161</b><p className="text-xs text-slate-500">Deemed Universities</p></div>
    <div className="rounded-2xl bg-white p-5"><b className="text-2xl">560</b><p className="text-xs text-slate-500">Private Universities</p></div>
   </div>
   <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    <b>Important:</b> University recognition does not automatically mean every distance/online course is recognised. YCM will verify the exact university + mode + programme + academic session through UGC-DEB.
   </div>
   <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search open university, state..." className="mt-6 w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"/>
   <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {rows.map(u=><article key={u.id} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-blue-700">{u.state}</div>
      <h2 className="mt-2 font-extrabold">{u.name}</h2>
      <p className="mt-2 text-xs text-slate-500">{u.type.replace("_"," ")} • Live recognition verification required</p>
      <a className="mt-4 inline-block text-sm font-bold text-blue-700" href={UGC_DEB_DIRECTORY.url} target="_blank" rel="noreferrer">Verify UGC-DEB programme →</a>
    </article>)}
   </div>
   <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
    <h2 className="font-black">All India UGC University Directory</h2>
    <p className="mt-2 text-sm text-slate-300">The complete UGC directory is maintained by UGC and changes over time. YCM should consume/refresh that source rather than permanently hard-code a stale list.</p>
    <a className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href={UGC_UNIVERSITY_DIRECTORY.url} target="_blank" rel="noreferrer">Open UGC University Directory</a>
   </div>
  </section>
 </main>;
}
