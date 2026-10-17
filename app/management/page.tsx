import Link from "next/link";

export default function ManagementDashboard() {
  const modules = [
    ["Employee Verification", "/management/employee-verification"],
    ["CEO Command Center", "/command-center"],
    ["Work Assignments", "/workspace"],
    ["Lead Control Center", "/management/lead-control"],
    ["Service Master", "/service-master"],
  ];
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-amber-300">YCM ONE · Management</p>
        <h1 className="mt-2 text-4xl font-bold">Management Operations</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Role-scoped management entry points for people, work, services and executive operations.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {modules.map(([label, href]) => (
            <Link key={label} href={href} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
              <span className="text-lg font-semibold">{label}</span>
              <span className="mt-2 block text-sm text-slate-400">Open existing YCM ONE flow →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
