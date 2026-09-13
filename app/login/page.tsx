export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">YCM ONE • Secure Access</p>
        <h1 className="mt-3 text-3xl font-black">Verified Login</h1>
        <p className="mt-3 text-slate-300">YCM uses separate, role-bound sessions for Family, Employee, Management, CEO, Admin, Partner and Referral accounts.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {['Family / Customer','Employee','Management','CEO / Admin','Partner','Referral'].map(role => (
            <div key={role} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <div className="font-bold">{role}</div>
              <div className="mt-1 text-xs text-slate-500">Verified authentication required</div>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl bg-amber-400/10 p-4 text-sm text-amber-200">No shared demo credentials are provided. Production login must issue a signed server-side session after the appropriate identity verification.</p>
      </div>
    </main>
  );
}
