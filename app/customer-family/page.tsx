'use client';

import { useMemo, useState } from 'react';
import { FAMILY_360_LIFECYCLE, FAMILY_REGISTRATION_PLAN } from '../customer-family';

const modules = [
  ['Family Account', 'One family registration for 2 years'],
  ['Members', 'Add and manage family members'],
  ['Consent Ledger', 'Track service and data permissions'],
  ['Document Vault', 'Connect verified documents to cases'],
  ['Cases', 'Link every need to the 35-domain Case Universe'],
  ['Tracking', 'TAT, status, outcome and CRI/CSAT'],
];

export default function CustomerFamilyPage() {
  const [familyId, setFamilyId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');

  const readiness = useMemo(() => [
    ['Master family model', true],
    ['35-domain case linkage', true],
    ['OTP authentication', false],
    ['Payment gateway verification', false],
    ['Persistent production database', false],
  ], []);

  async function register() {
    setFamilyId('');
    setMessage('Creating family registration…');
    try {
      const response = await fetch('/api/customer-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, mobile, country: 'India' }),
      });
      const data = await response.json();
      if (response.status === 201 && data.family?.familyId) {
        setFamilyId(data.family.familyId);
        setMessage('Registration request saved. OTP and payment are the next activation steps.');
      } else {
        setMessage(data.message || 'Registration was not created.');
      }
    } catch {
      setMessage('Unable to reach the Family 360 API.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">YCM ONE</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Customer + Family 360</h1>
            <p className="mt-3 max-w-3xl text-slate-300">A single family account connecting members, consent, documents, cases, applications, tracking and outcomes.</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-right">
            <div className="text-2xl font-bold">₹{FAMILY_REGISTRATION_PLAN.amount}</div>
            <div className="text-sm text-slate-300">{FAMILY_REGISTRATION_PLAN.validityYears}-year family plan</div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {modules.map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Start Family Registration</h2>
            <p className="mt-1 text-sm text-slate-400">The account is persisted only when the production PostgreSQL database is configured. No fake Family ID is shown when storage is unavailable.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">Primary member name<input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="Full name" /></label>
              <label className="text-sm text-slate-300">Mobile<input value={mobile} onChange={e => setMobile(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="10-digit mobile" inputMode="tel" /></label>
            </div>
            <button onClick={register} className="mt-5 rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Create family registration</button>
            {familyId && <div className="mt-4 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200">Family ID: <strong>{familyId}</strong></div>}
            {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Production Readiness</h2>
            <div className="mt-4 space-y-3">
              {readiness.map(([label, ready]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 px-4 py-3 text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className={ready ? 'text-emerald-300' : 'text-amber-300'}>{ready ? 'READY' : 'PENDING'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Family 360 Lifecycle</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {FAMILY_360_LIFECYCLE.map((step, index) => (
              <div key={step} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-xs font-bold text-cyan-300">{String(index + 1).padStart(2, '0')}</div>
                <div className="mt-2 text-sm font-medium">{step}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
