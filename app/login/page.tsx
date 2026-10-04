'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const search = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('account');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, password, ...(identifierType !== 'account' ? { identifierType } : {}) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMessage(d.message || 'User ID/email/mobile या password गलत है.');
      else window.location.href = search.get('next') || '/workspace';
    } catch {
      setMessage('Server से connection नहीं हुआ.');
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={login} className="mt-7 space-y-4">
    <label className="block"><span className="text-xs font-bold text-slate-600">Login method</span><select value={identifierType} onChange={e => { setIdentifierType(e.target.value); setIdentifier(""); }} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"><option value="account">User ID / Mobile / Email</option><option value="aadhaar">Aadhaar (verified)</option><option value="jan_aadhaar">Jan Aadhaar (verified)</option><option value="pan">PAN (verified)</option><option value="voter_id">Voter ID (verified)</option><option value="ration_card">Ration Card (verified)</option><option value="passport">Passport (verified)</option><option value="driving_license">Driving Licence (verified)</option></select></label>\n    <label className="block"><span className="text-xs font-bold text-slate-600">Identifier</span><input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder={identifierType === "account" ? "YCM-XXXXXX / 98XXXXXXXX / email" : `Enter your ${identifierType.replace("_", " ")}`} required /></label>
    <label className="block"><span className="text-xs font-bold text-slate-600">Password</span><input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Enter password" required /></label>
    <div className="flex justify-end"><a href="/forgot-password" className="text-sm font-bold text-blue-700 hover:underline">Forgot password?</a></div>
    {message && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>}
    <button disabled={loading} className="w-full rounded-2xl bg-slate-950 py-3.5 font-black text-white shadow-lg hover:bg-blue-800 disabled:opacity-60">{loading ? 'Signing in…' : 'Login to YCM One →'}</button>
  </form>;
}

export default function LoginPage() {
  return <main className="min-h-screen bg-[#071a49] text-white"><div className="absolute inset-0 overflow-hidden"><div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"/><div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"/></div><div className="relative mx-auto grid min-h-screen max-w-6xl px-4 py-8 lg:grid-cols-[1fr_520px] lg:items-center lg:gap-16">
    <section className="hidden lg:block"><button onClick={() => location.href = '/'} className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-xl font-black">Y</span><span><b>YOJANA CONNECT MITRA</b><small className="block text-xs text-blue-200">YCM ONE • Digital Mitra</small></span></button><div className="mt-20"><p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">Secure account access</p><h1 className="mt-4 text-5xl font-black leading-tight">आपका पूरा YCM One — <span className="text-cyan-300">एक login.</span></h1><p className="mt-6 max-w-xl leading-7 text-blue-100">Family, Farmer, Student, Legal Mitra, Employee और management के लिए role-based workspace.</p></div></section>
    <section className="rounded-[32px] border border-white/15 bg-white/[.08] p-4 shadow-2xl backdrop-blur-xl sm:p-6"><div className="rounded-[26px] bg-white p-6 text-slate-950 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YCM ONE LOGIN</p><h2 className="mt-2 text-3xl font-black">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Account या verified identity से secure login करें.</p>
      <Suspense fallback={<div className="mt-7 rounded-2xl bg-slate-100 p-4 text-sm text-slate-500">Login form loading…</div>}><LoginForm /></Suspense>
      <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/>NEW TO YCM?<span className="h-px flex-1 bg-slate-200"/></div>
      <a href="/register" className="block w-full rounded-2xl border border-slate-200 py-3.5 text-center font-black hover:bg-slate-50">Create Family / Citizen Account</a>
      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-800"><b>Local preview:</b> dev role login remains available only when <code>YCM_DEV_LOGIN=true</code> and production mode is off.</div>
    </div></section></div></main>;
}
