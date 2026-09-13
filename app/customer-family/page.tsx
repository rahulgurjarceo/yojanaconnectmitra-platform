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

const steps = ['Registration', 'OTP verification', '₹99 payment', 'Activation'];

export default function CustomerFamilyPage() {
  const [familyId, setFamilyId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [signature, setSignature] = useState('');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const readiness = useMemo(() => [
    ['Master family model', true],
    ['35-domain case linkage', true],
    ['Registration → OTP → payment → activation UI', true],
    ['OTP provider', false],
    ['Payment gateway', false],
    ['Persistent production database', false],
  ], []);

  async function post(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.code || 'Request failed.');
    return data;
  }

  async function register() {
    setBusy(true); setMessage('Creating family registration…');
    try {
      const data = await post('/api/customer-family', { fullName: name, mobile: mobile.replace(/\s+/g, ''), country: 'India' });
      setFamilyId(data.family.familyId);
      setStep(1);
      setMessage('Family ID created. Sending OTP…');
      const otpData = await post('/api/customer-family/otp', { familyId: data.family.familyId, mobile: mobile.replace(/\s+/g, '') });
      setChallengeId(otpData.challengeId);
      setMessage('OTP sent to the registered mobile number.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally { setBusy(false); }
  }

  async function verifyOtp() {
    setBusy(true); setMessage('Verifying OTP…');
    try {
      await post('/api/customer-family/otp/verify', { challengeId, otp });
      setStep(2);
      setMessage('OTP verified. Creating the ₹99 payment order…');
      const payment = await post('/api/customer-family/payment/order', { familyId });
      setOrderId(payment.order.orderId);
      setMessage('Payment order created. Complete payment in the configured gateway, then enter its payment ID and signature below.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP verification failed.');
    } finally { setBusy(false); }
  }

  async function verifyPayment() {
    setBusy(true); setMessage('Verifying payment signature…');
    try {
      await post('/api/customer-family/payment/verify', { orderId, paymentId, signature });
      setStep(3);
      setMessage('Payment verified. Activating Family 360…');
      const activated = await post('/api/customer-family/activation', { familyId });
      if (activated.status === 'active') {
        setMessage('Family 360 is active. Opening your Family Dashboard…');
        window.location.assign('/family-dashboard');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment verification failed.');
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">YCM ONE</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Customer + Family 360</h1>
            <p className="mt-3 max-w-3xl text-slate-300">One family account connecting members, consent, documents, cases, applications, tracking and outcomes.</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-right">
            <div className="text-2xl font-bold">₹{FAMILY_REGISTRATION_PLAN.amount}</div>
            <div className="text-sm text-slate-300">{FAMILY_REGISTRATION_PLAN.validityYears}-year family plan</div>
          </div>
        </div>

        <div className="mb-8 grid gap-2 md:grid-cols-4">
          {steps.map((label, index) => (
            <div key={label} className={`rounded-xl border p-3 text-sm ${index <= step ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-500'}`}>
              <span className="mr-2 font-bold">{String(index + 1).padStart(2, '0')}</span>{label}
            </div>
          ))}
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
            <h2 className="text-xl font-semibold">{steps[step] ?? 'Family 360'}</h2>
            <p className="mt-1 text-sm text-slate-400">Production APIs are chained server-side. The browser never decides whether OTP or payment is verified; activation checks the database state.</p>

            {step === 0 && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">Primary member name<input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="Full name" /></label>
                <label className="text-sm text-slate-300">Mobile<input value={mobile} onChange={e => setMobile(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="10-digit mobile" inputMode="tel" /></label>
                <button disabled={busy || !name || !/^\+?[0-9]{10,15}$/.test(mobile.replace(/\s+/g, ''))} onClick={register} className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2">{busy ? 'Please wait…' : 'Create family registration & send OTP'}</button>
              </div>
            )}

            {step === 1 && (
              <div className="mt-5 max-w-md">
                <div className="rounded-xl bg-slate-900/80 p-4 text-sm text-slate-300">Family ID: <strong className="text-white">{familyId}</strong></div>
                <label className="mt-4 block text-sm text-slate-300">OTP<input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="Enter OTP" inputMode="numeric" /></label>
                <button disabled={busy || !challengeId || !/^\d{4,8}$/.test(otp)} onClick={verifyOtp} className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Verifying…' : 'Verify OTP & continue to payment'}</button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-5 max-w-xl">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-300">Order ID: <strong className="text-white">{orderId}</strong><br />Amount: <strong className="text-white">₹99 INR</strong></div>
                <p className="mt-4 text-sm text-amber-200">The real payment gateway must be configured server-side before a customer can complete this step. After gateway checkout, submit the provider&apos;s payment ID and signature here.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-300">Payment ID<input value={paymentId} onChange={e => setPaymentId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="Gateway payment ID" /></label>
                  <label className="text-sm text-slate-300">Signature<input value={signature} onChange={e => setSignature(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="Gateway signature" /></label>
                </div>
                <button disabled={busy || !orderId || !paymentId || !signature} onClick={verifyPayment} className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Processing…' : 'Verify payment & activate Family 360'}</button>
              </div>
            )}

            {step === 3 && <div className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-emerald-200">Activation completed. Redirecting to Family Dashboard…</div>}
            {message && <p className="mt-5 text-sm text-slate-300">{message}</p>}
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
            {FAMILY_360_LIFECYCLE.map((item, index) => (
              <div key={item} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-xs font-bold text-cyan-300">{String(index + 1).padStart(2, '0')}</div>
                <div className="mt-2 text-sm font-medium">{item}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
