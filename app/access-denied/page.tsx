export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-white/5 p-8 text-center">
        <div className="text-5xl">🔐</div>
        <h1 className="mt-4 text-3xl font-black">Access denied</h1>
        <p className="mt-3 text-slate-300">Your verified account role does not have permission to open this YCM area. Sign in with the authorized account type.</p>
      </div>
    </main>
  );
}
