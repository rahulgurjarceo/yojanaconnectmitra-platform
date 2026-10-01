'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const roleRoutes: Record<string,string> = {
  family: '/family-dashboard', farmer: '/farmer', lawyer: '/lawyer', student: '/student',
  employee: '/employee', management: '/command-center', ceo: '/command-center', admin: '/command-center',
  partner: '/crm', referral: '/crm',
};

export default function WorkspacePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async r => {
        const data = await r.json();
        if (!r.ok || !data.authenticated) throw new Error('LOGIN_REQUIRED');
        router.replace(roleRoutes[data.user.role] || '/');
      })
      .catch(e => setError(e instanceof Error ? e.message : 'LOGIN_REQUIRED'));
  }, [router]);
  return <main className="min-h-screen bg-slate-950 p-8 text-white"><div className="mx-auto max-w-xl rounded-3xl bg-white/10 p-8"><h1 className="text-2xl font-black">YCM ONE Workspace</h1>{error ? <p className="mt-4 text-red-300">{error}</p> : <p className="mt-4 text-slate-300">Opening your role workspace…</p>}</div></main>;
}
