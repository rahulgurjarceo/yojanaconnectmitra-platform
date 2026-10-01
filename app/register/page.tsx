'use client';

import { useState } from 'react';

type FormField = 'fullName' | 'mobile' | 'email' | 'password' | 'confirm';

const fields: Array<[FormField, string, string, boolean]> = [
  ['fullName', 'Full name', 'text', true],
  ['mobile', 'Mobile number', 'tel', false],
  ['email', 'Email', 'email', true],
  ['password', 'Password', 'password', true],
  ['confirm', 'Confirm password', 'password', true],
];

export default function Register() {
  const [f, setF] = useState<Record<FormField, string>>({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [m, setM] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setM('');
    if (f.password !== f.confirm) return setM('Passwords match नहीं हैं.');
    setLoading(true);

    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (!r.ok) setM(d.message || 'Registration failed');
      else setM(`Account बन गया. आपका User ID: ${d.userId}. इसे सुरक्षित रखें.`);
    } catch {
      setM('Server connection failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071a49] p-4 text-white">
      <div className="mx-auto max-w-lg pt-10">
        <div className="rounded-[32px] bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YCM ONE</p>
          <h1 className="mt-2 text-3xl font-black">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Family / Citizen account — email recovery के लिए जरूरी है.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            {fields.map(([key, placeholder, type, required]) => (
              <input
                key={key}
                required={required}
                value={f[key]}
                onChange={(e) => setF((current) => ({ ...current, [key]: e.target.value }))}
                type={type}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-400 focus:bg-white"
              />
            ))}
            <p className="text-xs text-slate-500">Password: minimum 12 characters with uppercase, lowercase and number.</p>
            {m && <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-800">{m}</div>}
            <button disabled={loading} className="w-full rounded-2xl bg-slate-950 py-3.5 font-black text-white">
              {loading ? 'Creating…' : 'Create YCM Account →'}
            </button>
          </form>
          <a href="/login" className="mt-5 block text-center text-sm font-bold text-blue-700">Already have an account? Login</a>
        </div>
      </div>
    </main>
  );
}
