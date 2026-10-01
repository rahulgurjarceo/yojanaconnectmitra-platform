'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

const roles=[
 ['family','👨‍👩‍👧‍👦','Family / Citizen','Family, documents, schemes & applications'],
 ['farmer','🌾','Farmer Mitra','Schemes, KCC, crop & market support'],
 ['lawyer','⚖️','Lawyer / Legal Mitra','Cases, clients, documents & legal workflow'],
 ['student','🎓','Student','Universities, scholarships & career'],
 ['employee','🧑‍💼','Employee / Mitra','Customers, cases, documents & tasks'],
 ['management','📊','Management','CRM, reports & operations'],
 ['ceo','◈','CEO','Command centre, finance, HR & management'],
 ['admin','🛡️','Admin','Platform, users & security'],
 ['partner','🤝','Partner','Customers & referrals'],
 ['referral','↗','Referral','Referral pipeline & handoff'],
] as const;

export default function LoginPage(){
 const search=useSearchParams(); const [loading,setLoading]=useState(''); const [message,setMessage]=useState('');
 async function devLogin(role:string){
  setLoading(role);setMessage('');
  try{const response=await fetch('/api/auth/dev-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role})});const data=await response.json().catch(()=>({}));if(!response.ok)setMessage(data.code||'Login unavailable');else window.location.href=search.get('next')||'/workspace';}
  catch{setMessage('Local server से connection नहीं हुआ।');}finally{setLoading('');}
 }
 return <main className="min-h-screen bg-[#071a49] text-white"><div className="absolute inset-0 overflow-hidden"><div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"/><div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"/></div>
 <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
  <section className="hidden lg:block"><button onClick={()=>window.location.href='/'} className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-xl font-black">Y</span><span><b className="block">YOJANA CONNECT MITRA</b><small className="text-xs text-blue-200">YCM ONE • Digital Mitra</small></span></button><div className="mt-20"><p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">ONE PLATFORM • MANY JOURNEYS</p><h1 className="mt-4 text-5xl font-black leading-tight">अपने role के हिसाब से <span className="text-cyan-300">अपना YCM workspace</span> खोलें.</h1><p className="mt-6 max-w-xl leading-7 text-blue-100">Family, Farmer, Student, Lawyer, Employee और management—हर role के लिए अलग permission और workflow.</p></div></section>
  <section className="mx-auto w-full max-w-2xl rounded-[32px] border border-white/15 bg-white/[.08] p-4 shadow-2xl backdrop-blur-xl sm:p-6"><div className="rounded-[26px] bg-white p-5 text-slate-950 sm:p-7">
   <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YCM ONE LOGIN</p><h2 className="mt-2 text-3xl font-black">अपना workspace चुनें</h2><p className="mt-2 text-sm text-slate-500">Local preview में role चुनकर सीधे workspace खोलें.</p></div><button onClick={()=>window.location.href='/'} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg">×</button></div>
   <div className="mt-6 grid gap-3 sm:grid-cols-2">{roles.map(([id,icon,title,desc])=><button key={id} onClick={()=>devLogin(id)} disabled={!!loading} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg disabled:opacity-60"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl shadow-sm">{icon}</span><span className="min-w-0"><b className="block">{title}</b><small className="mt-0.5 block text-xs leading-5 text-slate-500">{desc}</small></span></div><span className="mt-3 block text-xs font-black text-blue-700">{loading===id?'Opening…':'Open workspace →'}</span></button>)}</div>
   <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800"><b>Local development preview:</b> role buttons work only when <code>YCM_DEV_LOGIN=true</code> and production mode is off. Production में OTP/verified identity flow रहेगा.</div>
   {message&&<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>}
  </div></section>
 </div></main>;
}