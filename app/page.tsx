'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Domain = { id: string; icon: string; title: string; group: string; description: string; steps: string[] };

const domains: Domain[] = [
  {id:'schemes',icon:'🏛️',title:'Government Schemes & Public Services',group:'Citizen',description:'Find relevant public schemes, understand eligibility and prepare applications.',steps:['Tell us your need and location','Review eligibility and official requirements','Prepare documents and track the next step']},
  {id:'documents',icon:'📄',title:'Documents & Certificates',group:'Citizen',description:'Guided support for document checklists, certificates and application readiness.',steps:['Choose the document or certificate','Check the official checklist','Get assisted application and status guidance']},
  {id:'education',icon:'🎓',title:'Education, Admissions & Scholarships',group:'Education',description:'Explore courses, admissions, scholarships and education pathways.',steps:['Share class, qualification and goal','Shortlist suitable opportunities','Prepare documents and application timeline']},
  {id:'jobs',icon:'💼',title:'Jobs, Employment & Internships',group:'Education',description:'Discover verified opportunities, skills pathways and application support.',steps:['Share skills, location and preferred role','Review opportunity details and eligibility','Prepare your profile and apply through the relevant channel']},
  {id:'business',icon:'🏪',title:'Business, Startups & MSME',group:'Business',description:'Business setup guidance, MSME pathways, registrations and operational support.',steps:['Understand your business activity','Identify applicable registrations and support','Connect with the relevant professional or authority']},
  {id:'finance',icon:'💳',title:'Loans, Finance & Insurance',group:'Business',description:'Understand finance options and connect with appropriately authorised providers.',steps:['Share requirement and basic profile','Review product information and provider eligibility','Proceed only through authorised lender or insurer']},
  {id:'tax',icon:'🧾',title:'Tax, GST & Accounting',group:'Business',description:'Organise records and access qualified tax, GST and accounting assistance.',steps:['Identify the filing or accounting need','Prepare records and checklist','Route to qualified professional where required']},
  {id:'legal',icon:'⚖️',title:'Legal & Documentation Assistance',group:'Professional',description:'Legal information, document readiness and connection to qualified legal professionals.',steps:['Describe the issue and jurisdiction','Organise documents and timeline','Refer to an enrolled advocate when legal advice or representation is needed']},
  {id:'property',icon:'🏠',title:'Property & Land Assistance',group:'Professional',description:'Guided support for land records, property documentation and relevant public processes.',steps:['Select property or land-record need','Identify location-specific records','Follow the official process or professional referral']},
  {id:'court',icon:'🏛️',title:'Court & Authority Process Assistance',group:'Professional',description:'Understand procedural steps, notices and document organisation; not a substitute for counsel.',steps:['Identify authority and case stage','Organise notices and supporting records','Refer legal strategy to a qualified advocate']},
  {id:'health',icon:'🩺',title:'Health Service Discovery',group:'Citizen',description:'Find healthcare facilities and understand available service pathways.',steps:['Share location and type of care needed','Review facility and service information','Contact provider directly for clinical advice and appointments']},
  {id:'travel',icon:'✈️',title:'Travel, Passport & Visa',group:'Global',description:'Travel document checklists and routing to official passport, visa and travel channels.',steps:['Choose destination and travel purpose','Review official requirements and timelines','Apply through the relevant official authority']},
  {id:'overseas',icon:'🌐',title:'Overseas Education & Employment',group:'Global',description:'Explore overseas study and work pathways with careful verification of institutions and recruiters.',steps:['Share country, course or role preference','Verify institution, employer and requirements','Proceed only after reviewing fees, contracts and official rules']},
  {id:'family',icon:'👨‍👩‍👧‍👦',title:'Women, Children & Family Support',group:'Citizen',description:'Family-centred information, welfare navigation and referral to appropriate support services.',steps:['Choose the support category','Review eligibility and local support options','Connect with the responsible service provider']},
  {id:'disability',icon:'♿',title:'Disability & Social Welfare',group:'Citizen',description:'Information on disability-related certificates, benefits and accessible service pathways.',steps:['Identify the required support','Check official eligibility and documents','Route to the responsible authority or service centre']},
  {id:'agriculture',icon:'🌾',title:'Agriculture & Farmer Services',group:'Agriculture',description:'Farmer schemes, crop support, KCC information, market and agri-service discovery.',steps:['Share crop, land and location details','Identify relevant scheme or service','Connect to the authorised department, bank or partner']},
  {id:'labour',icon:'🦺',title:'Labour & Worker Services',group:'Citizen',description:'Worker registration information, welfare benefits and employment-related service navigation.',steps:['Select worker category and state','Check current official requirements','Prepare documents and follow the authorised channel']},
  {id:'pension',icon:'🧓',title:'Pension Services',group:'Citizen',description:'Pension scheme discovery, application checklists and status guidance.',steps:['Identify pension type and location','Check eligibility and required records','Submit or track through the official channel']},
  {id:'banking',icon:'🏦',title:'Banking & Financial-Service Assistance',group:'Business',description:'Assisted discovery of banking services through authorised banking partners.',steps:['Choose the banking service','Review provider, charges and eligibility','Complete the transaction only with an authorised provider']},
  {id:'digital',icon:'📱',title:'Digital Services',group:'Digital',description:'Assisted digital forms, online applications, document uploads and citizen workflows.',steps:['Choose the digital task','Prepare information and files','Review before submitting on the relevant portal']},
  {id:'utility',icon:'💡',title:'Utility Services',group:'Digital',description:'Guidance for electricity, water, gas and other utility service requests.',steps:['Select utility and service area','Keep account or consumer details ready','Use the official provider channel for payment or complaint']},
  {id:'consumer',icon:'🛡️',title:'Consumer Complaints & Grievances',group:'Professional',description:'Organise bills, evidence and complaint steps for consumer issues.',steps:['Describe the issue and purchase date','Collect invoice, communication and evidence','Use the appropriate official grievance mechanism']},
  {id:'police',icon:'🚔',title:'Police & Public Grievance Routing',group:'Citizen',description:'Information on public grievance channels and appropriate authority routing.',steps:['Identify the nature and urgency','Find the correct jurisdiction and official channel','For emergencies, contact local emergency services directly']},
  {id:'municipal',icon:'🏙️',title:'Local-Body & Municipal Services',group:'Citizen',description:'Municipal and panchayat service discovery, local forms and application guidance.',steps:['Select state, district and local body','Identify service and documents','Follow the local authority process']},
  {id:'ngo',icon:'🤝',title:'NGO & Social Assistance',group:'Citizen',description:'Discover community support, verified organisations and social assistance pathways.',steps:['Describe the need and location','Review organisation scope and credibility','Connect directly and confirm terms before sharing documents']},
  {id:'professional',icon:'🧑‍💼',title:'Professional Services',group:'Professional',description:'Find qualified professionals for specialist support and consultations.',steps:['Choose professional category','Review credentials, scope and fees','Engage directly under a clear service agreement']},
  {id:'corporate',icon:'🏢',title:'Corporate & Business Services',group:'Business',description:'Business process support, vendor discovery and corporate service coordination.',steps:['Define business requirement','Confirm scope, deliverables and vendor credentials','Approve a written proposal before work starts']},
  {id:'international',icon:'🌍',title:'International Citizen & Resident Services',group:'Global',description:'Country-specific service discovery for residents, migrants and international customers.',steps:['Choose country and residency context','Review local rules and official sources','Route to verified local provider or authority']},
  {id:'transport',icon:'🚗',title:'Transport & Mobility',group:'Digital',description:'Transport document and mobility service navigation.',steps:['Select vehicle or mobility requirement','Check state and authority-specific rules','Use the relevant official transport portal or office']},
  {id:'food',icon:'🥗',title:'Food & Nutrition Services',group:'Citizen',description:'Food security, nutrition programme and public distribution information.',steps:['Select programme and location','Review current eligibility and documents','Contact the responsible department or centre']},
  {id:'skills',icon:'🛠️',title:'Skills & Vocational Training',group:'Education',description:'Find training, certification and skill-development pathways.',steps:['Share education and career goal','Compare course, provider and certification details','Enroll only after confirming fees and recognition']},
  {id:'housing',icon:'🏘️',title:'Housing & Urban Development',group:'Citizen',description:'Housing scheme discovery, urban development information and application guidance.',steps:['Share location and housing need','Check official scheme conditions','Prepare records and follow the authority process']},
  {id:'environment',icon:'🌱',title:'Environment & Climate',group:'Business',description:'Environmental programme information, sustainability support and relevant compliance routing.',steps:['Identify activity and location','Check applicable rules and permissions','Consult the responsible authority or qualified expert']},
  {id:'safety',icon:'🚨',title:'Public Safety & Emergency Support',group:'Citizen',description:'Public safety information and referral to appropriate emergency channels.',steps:['Identify immediate risk','Contact emergency services directly when urgent','Use YCM only for non-emergency information and follow-up']},
  {id:'youth',icon:'🏅',title:'Youth, Sports & Culture',group:'Education',description:'Youth programmes, sports opportunities, cultural events and participation pathways.',steps:['Choose programme or opportunity','Check age, location and eligibility','Apply through the organiser or official authority']},
];

const groups = ['All','Citizen','Education','Business','Professional','Agriculture','Digital','Global'];
const quick = ['Scholarships','PM-KISAN','KCC information','Job opportunities','Passport','GST support','Business setup','Family services'];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');
  const [selected, setSelected] = useState<Domain | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return domains.filter(d => (group === 'All' || d.group === group) &&
      (!q || [d.title,d.description,d.group,d.id].join(' ').toLowerCase().includes(q)));
  }, [query, group]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={() => window.scrollTo({top:0,behavior:'smooth'})} className="flex items-center gap-3 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-800 text-xl font-black text-white">Y</span>
            <span><b className="block text-sm tracking-tight">YOJANA CONNECT MITRA</b><small className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">YCM ONE • One Family, One Mitra</small></span>
          </button>
          <nav className="hidden items-center gap-6 text-sm font-bold md:flex">
            <a href="#domains" className="hover:text-blue-700">Services</a>
            <a href="#how-it-works" className="hover:text-blue-700">How it works</a>
            <button onClick={() => router.push('/contact')} className="hover:text-blue-700">Partner with us</button>
          </nav>
          <button onClick={() => router.push('/login')} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-800">Login / Register</button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#071b49] text-white">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-24">
          <div>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-cyan-200">YCM ONE • 35 SERVICE DOMAINS</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">हर जरूरत के लिए <span className="text-cyan-300">एक Digital Mitra.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">Government services, Family 360, education, jobs, agriculture, business, finance and professional assistance — एक ही connected platform पर। सही जानकारी से लेकर documents, application guidance और case tracking तक।</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => router.push('/login')} className="rounded-2xl bg-cyan-400 px-6 py-3.5 font-black text-slate-950 hover:bg-cyan-300">Start with Family 360 →</button>
              <a href="#domains" className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold hover:bg-white/15">Explore 35 services</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">{quick.map(x=><button key={x} onClick={()=>{setQuery(x);document.getElementById('domains')?.scrollIntoView({behavior:'smooth'});}} className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-blue-100 hover:bg-white/15">{x}</button>)}</div>
          </div>
          <div className="rounded-[30px] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <div className="rounded-[24px] bg-white p-6 text-slate-950">
              <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YOUR YCM JOURNEY</p><h2 className="mt-2 text-2xl font-black">आपको किस मदद की जरूरत है?</h2></div><span className="text-3xl">✦</span></div>
              <div className="mt-6 space-y-3">{[['01','Tell us your need','Choose a service or describe your goal'],['02','Understand your options','Eligibility, checklist and next steps'],['03','Get guided assistance','Self-service or connect with a Human Mitra'],['04','Track your case','Follow progress and receive updates']].map(([n,t,d])=><div key={n} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-700 text-sm font-black text-white">{n}</span><div><b className="text-sm">{t}</b><p className="mt-1 text-xs leading-5 text-slate-500">{d}</p></div></div>)}</div>
              <button onClick={()=>router.push('/contact')} className="mt-5 w-full rounded-xl bg-blue-700 py-3 font-extrabold text-white hover:bg-blue-800">Talk to a Mitra →</button>
              <p className="mt-3 text-center text-[11px] text-slate-400">Service availability depends on location, eligibility and verified partners.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 grid max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4">
        {[['35','Service domains'],['01','Connected platform'],['360°','Family-centred support'],['1:1','Human Mitra assistance']].map(([n,t])=><div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"><div className="text-2xl font-black text-blue-800">{n}</div><p className="mt-1 text-xs font-bold text-slate-500">{t}</p></div>)}
      </section>

      <section id="domains" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">YCM ONE ECOSYSTEM</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Explore all 35 service domains</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Search the catalogue or filter by category. Select any domain to see its service journey.</p></div>
          <div className="w-full md:max-w-sm"><label htmlFor="service-search" className="mb-2 block text-xs font-bold text-slate-600">Search services</label><input id="service-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search schemes, education, loans..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">{groups.map(g=><button key={g} onClick={()=>setGroup(g)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${group===g?'border-blue-800 bg-blue-800 text-white':'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}>{g}</button>)}</div>
        <p className="mt-5 text-xs font-semibold text-slate-500">Showing {visible.length} of {domains.length} domains</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map(d=><button key={d.id} onClick={()=>setSelected(d)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
            <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">{d.icon}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500">{d.group}</span></div>
            <h3 className="mt-5 text-base font-black leading-6">{d.title}</h3><p className="mt-2 min-h-[60px] text-xs leading-5 text-slate-500">{d.description}</p>
            <span className="mt-4 block text-xs font-black text-blue-700 group-hover:translate-x-1">Explore workflow →</span>
          </button>)}
        </div>
        {visible.length===0&&<div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold">No matching service found.</p><button onClick={()=>{setQuery('');setGroup('All');}} className="mt-3 text-sm font-bold text-blue-700">Clear filters</button></div>}
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">ONE CONNECTED WORKFLOW</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">From need to outcome — with clear steps</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['1','Discover','Find a service or opportunity'],['2','Check','Understand eligibility and requirements'],['3','Prepare','Create document checklist and application'],['4','Connect','Self-service, partner or Human Mitra'],['5','Track','Monitor progress and outcome']].map(([n,t,d])=><div key={n} className="rounded-2xl bg-slate-50 p-5"><span className="text-sm font-black text-blue-700">STEP {n}</span><h3 className="mt-3 font-black">{t}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{d}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[30px] bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 p-8 text-white sm:p-12"><div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">JOIN THE YCM NETWORK</p><h2 className="mt-2 text-3xl font-black">Customer, Mitra, Partner or Franchise?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Choose your role and connect with Yojana Connect Mitra for service access, partnership or business enquiries.</p></div><div className="flex flex-col gap-3 sm:flex-row"><button onClick={()=>router.push('/login')} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-900 hover:bg-blue-50">Login / Register</button><button onClick={()=>router.push('/contact')} className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/20">Contact YCM</button></div></div></div>
      </section>

      <footer className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-4 py-9 sm:px-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><b>YOJANA CONNECT MITRA PVT. LTD.</b><p className="mt-1 text-xs text-slate-400">YCM ONE • One Family, One Mitra</p></div><div className="flex flex-wrap gap-5 text-sm text-slate-300"><a href="#domains">Services</a><button onClick={()=>router.push('/login')}>Login</button><button onClick={()=>router.push('/contact')}>Contact</button></div></div><p className="mt-6 border-t border-white/10 pt-5 text-[11px] leading-5 text-slate-500">© {new Date().getFullYear()} Yojana Connect Mitra Pvt. Ltd. Service information is guidance only. Eligibility, approval, fees and timelines are determined by the relevant authority or authorised provider. YCM does not guarantee government benefits, loans, jobs, admissions or visa outcomes.</p></div></footer>

      {selected&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="domain-title" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">{selected.icon}</span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-700">{selected.group} DOMAIN</p><h2 id="domain-title" className="mt-1 text-xl font-black">{selected.title}</h2></div></div><button onClick={()=>setSelected(null)} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl">×</button></div><p className="mt-5 text-sm leading-6 text-slate-600">{selected.description}</p><h3 className="mt-6 text-sm font-black">Typical service journey</h3><ol className="mt-3 space-y-3">{selected.steps.map((s,i)=><li key={s} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-800">{i+1}</span><span className="leading-6 text-slate-600">{s}</span></li>)}</ol><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={()=>{setSelected(null);router.push('/login');}} className="rounded-xl bg-blue-800 py-3 text-sm font-black text-white hover:bg-blue-900">Start / Login</button><button onClick={()=>{setSelected(null);router.push('/contact');}} className="rounded-xl border border-slate-200 py-3 text-sm font-black hover:bg-slate-50">Talk to a Mitra</button></div></div></div>}
    </main>
  );
}
