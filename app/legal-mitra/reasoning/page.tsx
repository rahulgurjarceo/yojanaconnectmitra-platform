"use client";

import { useState } from "react";

type Report = {
 issueMap:string[]; factualGaps:string[]; evidencePlan:string[];
 behaviouralConsiderations:string[]; alternativeScenarios:{title:string;trigger:string;opposingArgument:string;lawyerAction:string;confidence:string}[];
 questionsForLawyer:string[]; riskFlags:string[];
};

export default function LegalReasoningPage(){
 const [facts,setFacts]=useState("");
 const [category,setCategory]=useState("");
 const [jurisdiction,setJurisdiction]=useState("India / Rajasthan");
 const [report,setReport]=useState<Report|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 async function run(){
  setError(""); setReport(null); setLoading(true);
  try{
   const res=await fetch("/api/legal-reasoning",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({facts,category,jurisdiction})});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||"Analysis failed");
   setReport(data.report);
  }catch(e:unknown){setError(e instanceof Error?e.message:"Analysis failed");}finally{setLoading(false);}
 }
 const box=(title:string,items:string[])=> <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold">{title}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">{items.map(x=><li key={x}>{x}</li>)}</ul></section>;
 return <main className="min-h-screen bg-slate-50 text-slate-900">
  <header className="bg-slate-950 px-6 py-10 text-white"><div className="mx-auto max-w-6xl"><div className="text-sm font-semibold tracking-[.2em] text-cyan-300">YCM ONE / LEGAL MITRA</div><h1 className="mt-2 text-3xl font-bold">🧠 Case Reasoning Studio</h1><p className="mt-2 max-w-3xl text-slate-300">Facts → evidence → behavioural interview lens → alternative scenarios → questions for lawyer.</p></div></header>
  <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
   <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="grid gap-4 md:grid-cols-2">
    <label className="text-sm font-semibold">Legal category<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Criminal / Cyber / Property" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
    <label className="text-sm font-semibold">Jurisdiction<input value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
   </div><label className="mt-4 block text-sm font-semibold">Case facts / client statement<textarea value={facts} onChange={e=>setFacts(e.target.value)} rows={10} placeholder="पूरा घटनाक्रम लिखें: कब, कहाँ, किसने क्या किया, पैसे/दस्तावेज/मैसेज, witnesses, police/court action..." className="mt-1 w-full rounded-2xl border border-slate-300 p-4 leading-7"/><span className="mt-1 block text-xs font-normal text-slate-500">Behaviour से guilt/lie/mental-health diagnosis नहीं निकाला जाएगा। यह decision-support है।</span></label><button onClick={run} disabled={loading} className="mt-4 rounded-2xl bg-indigo-700 px-6 py-3 font-bold text-white disabled:opacity-50">{loading?"Analysis चल रही है…":"🧠 Analyse Case"}</button>{error&&<div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}</section>
   {report&&<div className="space-y-5">{box("Issue Map",report.issueMap)}{box("Facts / Missing Information",report.factualGaps)}{box("Evidence Plan",report.evidencePlan)}{box("Psychology / Interview Lens",report.behaviouralConsiderations)}{box("Questions for Lawyer",report.questionsForLawyer)}{box("Risk Flags",report.riskFlags)}
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold">Alternative Case Scenarios</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{report.alternativeScenarios.map(s=><article key={s.title} className="rounded-2xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><h3 className="font-bold">{s.title}</h3><span className="text-xs font-semibold">{s.confidence}</span></div><p className="mt-2 text-sm"><b>Trigger:</b> {s.trigger}</p><p className="mt-2 text-sm"><b>Opposing argument:</b> {s.opposingArgument}</p><p className="mt-2 text-sm"><b>Lawyer action:</b> {s.lawyerAction}</p></article>)}</div></section>
    <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><b>LAWYER REVIEW REQUIRED:</b> This report does not predict a court outcome, assign a win probability, diagnose people, or replace legal advice. Applicable law must be checked against current authoritative sources.</div>
   </div>}
  </div>
 </main>
}
