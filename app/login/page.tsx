'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

const roles = [
  ['family','👨‍👩‍👧‍👦','Family / Citizen','Family profile, documents, schemes and applications'],
  ['farmer','🌾','Farmer Mitra','Farming schemes, KCC, crop, market and agri support'],
  ['lawyer','⚖️','Lawyer / Legal Mitra','Assigned legal cases, clients and legal workflow'],
  ['student','🎓','Student','Education, scholarships, admissions and career'],
  ['employee','🧑‍💼','Employee / Mitra','Assigned customers, cases, documents and tasks'],
  ['management','📊','Management','CRM, operations, reports and team oversight'],
  ['ceo','👑','CEO','Company command centre, finance, HR and management'],
  ['admin','🛡️','Admin','Platform, users and security administration'],
  ['partner','🤝','Partner','Partner customers and case referrals'],
  ['referral','🔗','Referral','Referral pipeline and case handoff'],
] as const;

export default function LoginPage() {
  const search = useSearchParams();
  const [loading,setLoading] = useState('');
  const [message,setMessage] = useState('');
  async function devLogin(role:string) {
    setLoading(role); setMessage('');
    const response = await fetch('/api/auth/dev-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role})});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) setMessage(data.code || 'Login unavailable');
    else window.location.href = search.get('next') || '/workspace';
    setLoading('');
  }
  return <main className="min-h-screen bg-slate-950 px-5 py-10 text-white"><div className="mx-auto max-w-6xl">
    <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">YCM ONE • Secure Workspace</p><h1 className="mt-3 text-4xl font-black">Who are you?</h1><p className="mx-auto mt-3 max-w-2xl text-slate-300">हर role का अपना workspace और permission scope है। Production में OTP / verified identity provider से session issue होगा।</p></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{roles.map(([id,icon,title,desc]) => <button key={id} onClick={()=>devLogin(id)} disabled={!!loading} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10 disabled:opacity-60"><div className="text-3xl">{icon}</div><h2 className="mt-3 font-black">{title}</h2><p className="mt-1 text-sm text-slate-400">{desc}</p><div className="mt-4 text-xs font-bold text-cyan-300">{loading===id?'Opening…':'Open workspace →'}</div></button>)}</div>
    <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">Development preview only: role buttons work only when <code>YCM_DEV_LOGIN=true</code> and production mode is off.</div>
    {message && <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{message}</div>}
  </div></main>;
}
