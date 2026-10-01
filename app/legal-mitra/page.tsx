"use client";

import { useMemo, useRef, useState } from "react";
import { LEGAL_CATEGORIES, COUNTRIES } from "./legal-data";

type SpeechResultEvent = { resultIndex:number; results:ArrayLike<{0:{transcript:string}} & {isFinal?:boolean}> };
type SpeechRecognitionLike = { lang:string; continuous:boolean; interimResults:boolean; onresult:((event:SpeechResultEvent)=>void)|null; onerror:(()=>void)|null; onend:(()=>void)|null; start:()=>void; stop:()=>void };
type SpeechRecognitionConstructor = new()=>SpeechRecognitionLike;
type FormState = {
 name:string; phone:string; whatsapp:string; email:string; address:string; country:string; jurisdiction:string;
 role:string; category:string; subcategory:string; incidentDate:string; incidentPlace:string; description:string;
 urgent:boolean; legalAid:boolean;
};

const initial:FormState = {name:"",phone:"",whatsapp:"",email:"",address:"",country:"India",jurisdiction:"",role:"Victim / Applicant",category:"",subcategory:"",incidentDate:"",incidentPlace:"",description:"",urgent:false,legalAid:false};

export default function LegalMitraPage(){
 const [form,setForm]=useState<FormState>(initial);
 const [recording,setRecording]=useState(false);
 const [message,setMessage]=useState("");
 const recognition=useRef<SpeechRecognitionLike|null>(null);
 const selected=useMemo(()=>LEGAL_CATEGORIES.find(c=>c.id===form.category),[form.category]);

 const update=(key:keyof FormState,value:string|boolean)=>setForm(v=>({...v,[key]:value}));

 const startVoice=()=>{
   const speechWindow=window as Window & { SpeechRecognition?:SpeechRecognitionConstructor; webkitSpeechRecognition?:SpeechRecognitionConstructor };
   const SR=typeof window!=="undefined" && (speechWindow.SpeechRecognition||speechWindow.webkitSpeechRecognition);
   if(!SR){setMessage("इस browser में voice input उपलब्ध नहीं है। कृपया text से बयान लिखें।");return;}
   if(recording){recognition.current?.stop();setRecording(false);return;}
   const r=new SR(); recognition.current=r; r.lang="hi-IN"; r.continuous=true; r.interimResults=true;
   let committed=form.description;
   r.onresult=(e:SpeechResultEvent)=>{let live=""; for(let i=e.resultIndex;i<e.results.length;i++){live+=e.results[i][0].transcript+" ";} const finalText=(committed+" "+live).trim(); update("description",finalText);};
   r.onerror=()=>{setRecording(false);setMessage("Voice input में समस्या हुई। आप दोबारा प्रयास कर सकते हैं।");};
   r.onend=()=>setRecording(false); r.start(); setRecording(true); setMessage("बोलिए… आपकी बात case statement में लिखी जा रही है।");
 };

 const submit=async(e:React.FormEvent)=>{
   e.preventDefault(); setMessage("Case बनाया जा रहा है…");
   try{
     const res=await fetch("/api/legal-intake",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
     const data=await res.json();
     if(!res.ok) throw new Error(data.error||"Unable to create case");
     setMessage(`Case ID: ${data.caseId}. अब client confirmation और lawyer/legal-aid routing किया जा सकता है.`);
   }catch(err:unknown){setMessage(err instanceof Error?err.message:"कुछ गलत हुआ।");}
 };

 return <main className="min-h-screen bg-slate-50 text-slate-900">
   <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white">
    <div className="mx-auto max-w-7xl px-6 py-14">
     <div className="flex flex-wrap items-center justify-between gap-5">
      <div><div className="text-sm font-semibold tracking-[.2em] text-cyan-300">YCM ONE</div><h1 className="mt-2 text-4xl font-bold md:text-5xl">⚖️ Legal Mitra</h1><p className="mt-3 max-w-2xl text-slate-200">Global legal-assistance intake: बोलकर समस्या बताइए, case तैयार कीजिए, documents जोड़िए और सही legal professional / legal-aid route तक पहुंचिए।</p></div>
      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur"><div className="font-semibold">Jurisdiction-first AI</div><div className="mt-1 text-slate-300">Country → jurisdiction → source → case</div></div>
     </div>
    </div>
   </section>

   <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
    <form onSubmit={submit} className="space-y-6">
     <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold">1. Client Details</h2><p className="mt-1 text-sm text-slate-500">Case ID submit होने पर automatically बनेगा।</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
       {([["name","Client name"],["phone","Mobile number"],["whatsapp","WhatsApp number"],["email","Email"] ] as const).map(([k,l])=><label key={k} className="text-sm font-medium">{l}<input required={k==="name"||k==="phone"} value={form[k]} onChange={e=>update(k,e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" /></label>)}
       <label className="text-sm font-medium md:col-span-2">Address<textarea required value={form.address} onChange={e=>update("address",e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
       <label className="text-sm font-medium">Country<select value={form.country} onChange={e=>update("country",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3">{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></label>
       <label className="text-sm font-medium">State / Province / Jurisdiction<input value={form.jurisdiction} onChange={e=>update("jurisdiction",e.target.value)} placeholder="e.g. Rajasthan / California" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
      </div>
     </section>

     <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold">2. Legal Problem</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
       <label className="text-sm font-medium">Client role<select value={form.role} onChange={e=>update("role",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3">{["Victim / Applicant","Accused / Respondent","Witness","Family member","Employer","Employee","Business","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
       <label className="text-sm font-medium">Main category<select required value={form.category} onChange={e=>{update("category",e.target.value);update("subcategory","")}} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"><option value="">Select category</option>{LEGAL_CATEGORIES.map(c=><option value={c.id} key={c.id}>{c.icon} {c.name}</option>)}</select></label>
       <label className="text-sm font-medium md:col-span-2">Sub-category<select value={form.subcategory} onChange={e=>update("subcategory",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"><option value="">Select if known</option>{selected?.subcategories.map(x=><option key={x}>{x}</option>)}</select></label>
       <label className="text-sm font-medium">Incident date<input type="date" value={form.incidentDate} onChange={e=>update("incidentDate",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
       <label className="text-sm font-medium">Incident place<input value={form.incidentPlace} onChange={e=>update("incidentPlace",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
      </div>
     </section>

     <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">3. अपनी समस्या बताइए</h2><p className="mt-1 text-sm text-slate-500">Text लिखें या microphone से Hindi/English में बोलें।</p></div><button type="button" onClick={startVoice} className={`rounded-full px-5 py-3 font-semibold text-white ${recording?"bg-red-600":"bg-indigo-600"}`}>{recording?"⏹️ Stop":"🎙️ बोलकर बताएं"}</button></div>
      <textarea required value={form.description} onChange={e=>update("description",e.target.value)} rows={9} placeholder="क्या हुआ? कब हुआ? कहाँ हुआ? किसके साथ हुआ? अब तक क्या कार्रवाई हुई? जो भी जानकारी है लिखें या बोलें…" className="mt-5 w-full rounded-2xl border border-slate-300 p-4 leading-7 outline-none focus:border-indigo-500"/>
      <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">AI आगे missing information पूछेगा और final case summary client की confirmation के बाद ही submit करेगा।</div>
     </section>

     <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold">4. Priority & Legal Aid</h2>
      <div className="mt-4 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.urgent} onChange={e=>update("urgent",e.target.checked)}/> Urgent / immediate attention</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.legalAid} onChange={e=>update("legalAid",e.target.checked)}/> I want legal-aid eligibility checked</label></div>
      <button className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-lg font-bold text-white hover:bg-slate-800">Create Legal Case →</button>
      {message&&<div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm font-medium">{message}</div>}
     </section>
    </form>

    <aside className="space-y-5">
      <div className="sticky top-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
       <h3 className="text-lg font-bold">Legal Mitra Flow</h3>
       <div className="mt-5 space-y-4 text-sm">{["🎙️ Voice / Text Intake","🧠 Case understanding","🌍 Jurisdiction detection","📚 Official legal-source lookup","📎 Document checklist","📝 Application / draft preparation","👨‍⚖️ Lawyer / legal-aid routing","💳 Payment & invoice","📊 Case tracking"].map((x,i)=><div className="flex gap-3" key={x}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{i+1}</span><span className="pt-1">{x}</span></div>)}</div>
       <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900"><b>Important:</b> AI provides legal information and workflow assistance. Specific legal advice, representation and disputed legal conclusions should be reviewed by a qualified legal professional.</div>
       <div className="mt-4 text-xs text-slate-500">India source baseline: India Code / NALSA. International jurisdictions must use their applicable official sources.</div>
      </div>
    </aside>
   </div>
 </main>
}
