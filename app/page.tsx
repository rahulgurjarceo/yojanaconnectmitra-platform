'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const services = [
  ['family','👨‍👩‍👧‍👦','Family 360','One family profile for members, documents, schemes and applications','Family'],
  ['legal','⚖️','Legal Mitra','Legal intake, document support, case workflow and professional connection','Legal'],
  ['education','🎓','Education','Admissions, scholarships, universities and career pathways','Education'],
  ['farmer','🌾','Farmer Mitra','Schemes, KCC, crop support, markets and agri finance','Agriculture'],
  ['jobs','💼','Jobs & Careers','Jobs, internships, skills and placement support','Career'],
  ['documents','📄','Document Centre','Document vault, checklists, verification and readiness','Documents'],
  ['schemes','🏛️','Yojana Finder','Discover relevant schemes, eligibility and required documents','Government'],
  ['finance','💳','Finance','Banking, loans, insurance and business funding pathways','Finance'],
  ['business','🏪','Business Mitra','Business setup, MSME, vendors, products and support','Business'],
  ['travel','✈️','Travel & Immigration','Passport, visa and international citizen assistance','Global'],
  ['digital','📱','Digital Services','Digital forms, applications, payments and assisted services','Digital'],
  ['support','🤝','Human Mitra','A real person for cases that need guided assistance','Support'],
] as const;

const quick = ['Scholarship','PM-KISAN','KCC Loan','Job','Passport','Legal Help','University Admission','Business'];

const languages = [
  ['hi','हिन्दी'],['en','English'],['mr','मराठी'],['gu','ગુજરાતી'],['bn','বাংলা'],
  ['ta','தமிழ்'],['te','తెలుగు'],['kn','ಕನ್ನಡ'],['ml','മലയാളം'],['pa','ਪੰਜਾਬੀ'],
  ['ar','العربية'],['es','Español'],['fr','Français'],['de','Deutsch'],
] as const;

const countries = [
  ['IN','🇮🇳','India'],['AE','🇦🇪','UAE'],['GB','🇬🇧','United Kingdom'],
  ['US','🇺🇸','United States'],['CA','🇨🇦','Canada'],['AU','🇦🇺','Australia'],
  ['SG','🇸🇬','Singapore'],['SA','🇸🇦','Saudi Arabia'],['QA','🇶🇦','Qatar'],
  ['NZ','🇳🇿','New Zealand'],
] as const;

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [modal, setModal] = useState('');
  const [language, setLanguage] = useState('hi');
  const [country, setCountry] = useState('IN');

  const filtered = useMemo(() => {
    const x = q.toLowerCase().trim();
    return x ? services.filter(s => s.join(' ').toLowerCase().includes(x)) : services;
  }, [q]);

  const selectedCountry = countries.find(c => c[0] === country)?.[2] ?? 'India';
  const selectedLanguage = languages.find(l => l[0] === language)?.[1] ?? 'हिन्दी';

  const open = (id: string) =>
    id === 'legal' ? router.push('/legal-mitra') :
    id === 'education' ? router.push('/education/universities') :
    id === 'family' ? router.push('/login') :
    setModal(id);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex shrink-0 items-center gap-3 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-400 text-lg font-black text-white shadow-lg shadow-blue-700/20">Y</span>
            <span className="hidden sm:block"><b className="block text-[15px] tracking-tight">YOJANA CONNECT MITRA</b><small className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">YCM ONE • Global Digital Mitra</small></span>
          </button>

          <div className="relative mx-auto hidden max-w-xl flex-1 md:block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search services, schemes, jobs, education..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold">
              <span>🌍</span>
              <select value={country} onChange={e => setCountry(e.target.value)} className="bg-transparent outline-none">
                {countries.map(([code, flag, name]) => <option key={code} value={code}>{flag} {name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold">
              <span>文</span>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-transparent outline-none">
                {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </label>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-bold xl:flex">
            <button onClick={() => router.push('/services')}>Services</button>
            <button onClick={() => router.push('/education/universities')}>Education</button>
            <button onClick={() => router.push('/legal-mitra')}>Legal</button>
          </nav>
          <button onClick={() => router.push('/login')} className="ml-auto rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/10 transition hover:bg-blue-800">Login / Register</button>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 px-4 pb-3 md:hidden">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="आपको क्या चाहिए?" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-24 rounded-2xl border border-slate-200 bg-white px-2 text-xs font-bold">
            {languages.slice(0, 6).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#061a49] text-white">
        <div className="absolute -left-28 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-[28rem] w-[28rem] rounded-full bg-blue-500/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.08fr_.92fr] md:items-center md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
              <i className="h-2 w-2 rounded-full bg-emerald-400" /> ONE PLATFORM • ONE FAMILY • ONE MITRA
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              हर जरूरत के लिए <span className="text-cyan-300">एक Digital Mitra.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
              Government services, family records, documents, education, jobs, business, finance, legal और international assistance — एक connected workflow में।
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => router.push('/login')} className="rounded-2xl bg-cyan-400 px-6 py-3.5 font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-300">मेरी Family शुरू करें →</button>
              <button onClick={() => router.push('/services')} className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-bold transition hover:bg-white/15">Explore Services</button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {quick.map(x => <button key={x} onClick={() => setQ(x)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-white/10">{x}</button>)}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/15 bg-white/[.08] p-3 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[26px] bg-white p-6 text-slate-950">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-blue-700">AI MITRA</p><h2 className="mt-1 text-xl font-black">आपको किस चीज़ में मदद चाहिए?</h2></div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl">✦</span>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">“मुझे scholarship चाहिए और मेरे documents भी check करने हैं।”</div>
              <div className="mt-3 rounded-2xl bg-blue-700 p-4 text-sm leading-6 text-white">मैं आपकी जरूरत के अनुसार eligibility, documents और next steps का रास्ता दिखा सकता हूँ।</div>
              <div className="mt-4 grid grid-cols-2 gap-2">{['Scholarship','Documents','Admission','Career'].map(x => <button key={x} onClick={() => setQ(x)} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-bold transition hover:border-blue-300 hover:bg-blue-50">↗ {x}</button>)}</div>
            </div>
            <p className="px-3 pb-1 pt-4 text-center text-xs text-blue-100">{selectedLanguage} • {selectedCountry} • Human Mitra escalation</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-7 max-w-7xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['01','Family 360','One connected profile'],
            ['24×7','AI Mitra','Guided assistance'],
            ['35','Service Domains','Global-ready architecture'],
            ['10+','Languages / Countries','Expandable catalogue'],
          ].map(([n,t,d]) => <div key={t} className="border-b border-slate-100 p-5 last:border-0 sm:border-r lg:border-b-0"><div className="text-2xl font-black text-blue-700">{n}</div><b className="mt-1 block text-sm">{t}</b><span className="text-xs text-slate-500">{d}</span></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YCM ONE ECOSYSTEM</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">हर जरूरत के लिए एक connected platform</h2><p className="mt-2 text-sm text-slate-500">Discover → Eligibility → Documents → Execution → Tracking → Outcome</p></div>
          <button onClick={() => router.push('/services')} className="hidden font-bold text-blue-700 sm:block">View all →</button>
        </div>
        {q && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm"><b>{filtered.length}</b> results for “{q}”.</div>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map(([id,icon,title,desc,tag]) => <button key={id} onClick={() => open(id)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
            <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-2xl">{icon}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">{tag}</span></div>
            <h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{desc}</p>
            <span className="mt-4 block text-sm font-black text-blue-700 transition group-hover:translate-x-1">Open module →</span>
          </button>)}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">GLOBAL-READY BY DESIGN</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">एक architecture, कई countries और languages.</h2><p className="mt-4 max-w-xl leading-7 text-slate-600">हर देश के लिए service catalogue, local authority, documents, eligibility, payment और compliance अलग रखे जाएंगे। इससे YCM One को नए देश में जोड़ने के लिए core platform दोबारा नहीं बनाना पड़ेगा।</p><div className="mt-6 flex flex-wrap gap-2">{countries.map(([code,flag,name]) => <button key={code} onClick={() => setCountry(code)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${country === code ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>{flag} {name}</button>)}</div></div>
          <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-3 sm:grid-cols-2">{[['🌍','Country','Local services & rules'],['文','Language','UI + AI Mitra'],['🪪','Identity','Customer / Family'],['📄','Documents','Country-specific checklist'],['💳','Payments','Local payment rails'],['📍','Authority','Provider / government routing']].map(([i,t,d]) => <div key={t} className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xl">{i}</span><b className="mt-2 block text-sm">{t}</b><span className="text-xs leading-5 text-slate-500">{d}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[32px] bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-100">ONE PLATFORM</p><h2 className="mt-2 text-3xl font-black">YCM Mitra से शुरू करें</h2><p className="mt-2 text-blue-50">अपना role चुनें, Family/Customer profile बनाएं और guided workflow से आगे बढ़ें।</p></div>
            <button onClick={() => router.push('/login')} className="rounded-2xl bg-white px-7 py-3.5 font-black text-blue-800 shadow-lg transition hover:bg-blue-50">Login / Register →</button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><b>YOJANA CONNECT MITRA</b><p className="mt-1 text-xs text-slate-500">YCM ONE • Global-ready digital public-service platform</p></div><div className="flex flex-wrap gap-5 text-sm text-slate-400"><button onClick={() => router.push('/services')}>Services</button><button onClick={() => router.push('/login')}>Login</button><button onClick={() => router.push('/legal-mitra')}>Legal Mitra</button></div></div>
          <div className="mt-7 border-t border-white/10 pt-5 text-xs text-slate-500">© {new Date().getFullYear()} Yojana Connect Mitra Pvt Ltd. • Country and service availability varies by verified local catalogue.</div>
        </div>
      </footer>

      {modal && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YCM MODULE</p><h2 className="mt-1 text-2xl font-black">{services.find(s => s[0] === modal)?.[2] ?? modal}</h2></div><button onClick={() => setModal('')} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl">×</button></div><p className="mt-5 leading-7 text-slate-600">यह module YCM One की common identity, documents, consent, payment, CRM और tracking layers से connected workflow में काम करेगा।</p><div className="mt-5 grid grid-cols-2 gap-3">{['Search','Eligibility','Documents','Application','Tracking','Notifications'].map(x => <div key={x} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold">✓ {x}</div>)}</div><button onClick={() => setModal('')} className="mt-6 w-full rounded-2xl bg-slate-950 py-3 font-black text-white">Back to YCM One</button></div></div>}
    </main>
  );
}
