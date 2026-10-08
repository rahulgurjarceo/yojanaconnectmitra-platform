'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

const projectTypes = [
  ['website', 'Website / Web Development'],
  ['software', 'Software / App Development'],
  ['calling', 'Calling / Telecalling / Customer Support'],
  ['digital', 'Digital Marketing / Lead Generation'],
  ['government', 'Government / Citizen Service Project'],
  ['other', 'Other Business / Service Requirement'],
];

export default function ContactPage() {
  const [market, setMarket] = useState('domestic');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const res = await fetch('/api/public/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, market, page: '/contact', consent: true }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('submit');
      setSubmitted(true);
    } catch {
      setError('Request submit नहीं हो पाई। कृपया WhatsApp या Call से सीधे संपर्क करें।');
    } finally { setBusy(false); }
  }

  const whatsapp = 'https://wa.me/919999999999?text=' + encodeURIComponent('Hello YCM, I want to discuss a project/service requirement.');
  const tel = 'tel:+919999999999';
  const email = 'mailto:contact@yojanaconnectmitra.com';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-black tracking-tight">YOJANA CONNECT MITRA <span className="text-blue-700">• YCM ONE</span></Link>
          <Link href="/" className="rounded-xl border px-4 py-2 text-sm font-bold">← Home</Link>
        </div>
      </header>
      <section className="bg-[#061a49] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_.9fr] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">CONTACT YCM ONE</p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Tell us what you need. We’ll route it to the right Mitra team.</h1>
            <p className="mt-5 max-w-2xl leading-7 text-blue-100">Domestic, USA or international — website, software, calling, customer support, digital services or YCM citizen-service projects. Submit one requirement and our team can take it forward.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950">WhatsApp →</a>
              <a href={tel} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-black">Call →</a>
              <a href={email} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-black">Email →</a>
            </div>
          </div>
          <div className="rounded-[30px] bg-white p-6 text-slate-950 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">HOW IT WORKS</p>
            <div className="mt-5 grid gap-3">
              {[
                ['01', 'Choose market', 'Domestic • USA • International'],
                ['02', 'Tell us the requirement', 'Website • Calling • Software • Services'],
                ['03', 'YCM creates a lead', 'Requirement is captured in the existing CRM'],
                ['04', 'Human follow-up', 'Team reviews, contacts and routes the work'],
              ].map(([n,t,d]) => <div key={n} className="flex gap-4 rounded-2xl bg-slate-50 p-4"><b className="text-blue-700">{n}</b><div><b className="block">{t}</b><span className="text-xs text-slate-500">{d}</span></div></div>)}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[['domestic','🇮🇳 Domestic'],['usa','🇺🇸 USA'],['international','🌍 International']].map(([id,label]) => <button type="button" key={id} onClick={() => setMarket(id)} className={market === id ? 'rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white' : 'rounded-2xl border bg-white px-4 py-3 text-sm font-black'}>{label}</button>)}
        </div>
        {submitted ? (
          <div className="rounded-[30px] border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">✓</div><h2 className="mt-3 text-2xl font-black">Request received.</h2>
            <p className="mt-2 text-slate-600">YCM has captured your requirement. Our team can follow up using the contact details you provided.</p>
            <div className="mt-6 flex justify-center gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-500 px-5 py-3 font-black text-white">WhatsApp Team</a><Link href="/" className="rounded-xl border px-5 py-3 font-black">Back to Home</Link></div>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-[30px] border bg-white p-6 shadow-sm sm:p-8">
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold">Name<input required name="name" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-blue-500" placeholder="Your name" /></label>
              <label className="text-sm font-bold">Company / Organisation<input name="company" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-blue-500" placeholder="Optional" /></label>
              <label className="text-sm font-bold">Mobile / WhatsApp<input name="mobile" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-blue-500" placeholder="+1 / +91..." /></label>
              <label className="text-sm font-bold">Email<input type="email" name="email" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-blue-500" placeholder="you@company.com" /></label>
              <label className="text-sm font-bold">Country<input name="country" defaultValue={market === 'usa' ? 'United States' : market === 'domestic' ? 'India' : ''} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
              <label className="text-sm font-bold">Project / Service<select required name="projectType" className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal outline-none focus:border-blue-500">{projectTypes.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="text-sm font-bold sm:col-span-2">Requirement<textarea required name="need" rows={5} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-blue-500" placeholder="Tell us what you want to build, outsource or get help with..." /></label>
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button disabled={busy} className="mt-6 w-full rounded-2xl bg-slate-950 px-6 py-4 font-black text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Send Requirement →'}</button>
            <p className="mt-3 text-center text-xs text-slate-500">By submitting, you agree that YCM may contact you about this requirement.</p>
          </form>
        )}
      </section>
    </main>
  );
}
