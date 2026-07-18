export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-black text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <h1 className="text-2xl font-bold text-cyan-400">
          YOJANA CONNECT MITRA
        </h1>

        <div className="hidden md:flex gap-8">
          <a href="#">Home</a>
          <a href="#">Services</a>
          <a href="#">Schemes</a>
          <a href="#">Partners</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">

        <h2 className="text-6xl font-extrabold leading-tight">
          AI Powered
          <br />
          Digital Citizen Platform
        </h2>

        <p className="mt-8 max-w-3xl text-xl text-gray-300">
          Government Services • Education • Farmer • Healthcare • Jobs •
          Insurance • Loans • Banking • Business • Digital Documents
        </p>

        <div className="mt-10 flex gap-5">
          <button className="bg-cyan-500 hover:bg-cyan-600 px-8 py-4 rounded-xl font-semibold">
            Get Started
          </button>

          <button className="border border-white px-8 py-4 rounded-xl">
            Explore Services
          </button>
        </div>

      </section>

    </main>
  );
}