import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Service Rate List | Yojana Connect Mitra",
  description: "Indicative YCM assistance charges for government scheme guidance, Jan Soochna, e-Mitra support, cyber cafe, education, documents and digital services.",
};

const rates = [
  { category: "MyScheme & Government Schemes", items: [
    ["Find schemes / basic information", "Free"],
    ["Personalised scheme eligibility search", "₹0–₹49"],
    ["Scheme document checklist", "₹20–₹49"],
    ["Detailed scheme guidance report", "₹49–₹199"],
    ["Farmer / pension / women welfare scheme guidance", "₹0–₹49"],
    ["Application process assistance", "₹30–₹100"],
  ]},
  { category: "Jan Soochna & Rajasthan Public Information", items: [
    ["Public information lookup", "Free–₹30"],
    ["Pension / ration / MGNREGA information lookup", "Free–₹30"],
    ["Beneficiary / payment status assistance", "Free–₹49"],
    ["Printout of public information", "₹5–₹20"],
    ["Document checklist / process guidance", "₹20–₹49"],
  ]},
  { category: "e-Mitra & Government Applications", items: [
    ["Certificate application assistance", "As per official e-Mitra rate"],
    ["Caste / income / domicile application assistance", "As per official e-Mitra rate"],
    ["Birth / death certificate assistance", "As per official e-Mitra rate"],
    ["Ration card / Jan Aadhaar assistance", "As per official e-Mitra rate"],
    ["Utility bill payment", "Portal-displayed fee, if any"],
    ["Application status check", "Use free official option where available"],
  ]},
  { category: "Cyber Cafe & Digital Work", items: [
    ["Black-and-white print", "₹3–₹5/page"],
    ["Colour print", "₹10–₹30/page"],
    ["Photocopy", "₹2–₹5/page"],
    ["Document scan", "₹5–₹20/page"],
    ["PDF create / merge", "₹10–₹50"],
    ["Online form filling", "₹50–₹200"],
    ["Government job form assistance", "₹50–₹150"],
    ["Admit card / result download", "₹10–₹30"],
    ["Resume / CV", "₹100–₹300"],
    ["Hindi / English typing", "₹30–₹100/page"],
    ["Photo / signature formatting", "₹20–₹100"],
    ["Online document upload", "₹20–₹100"],
    ["Lamination", "₹20–₹100"],
  ]},
  { category: "Documents & Citizen Services", items: [
    ["PAN application / correction assistance", "₹50–₹150 + official fee"],
    ["Voter ID application guidance", "₹30–₹100"],
    ["Aadhaar service guidance", "Free; updates only at authorised centres"],
    ["DigiLocker / document download assistance", "₹10–₹30"],
    ["Application tracking assistance", "₹0–₹49"],
    ["Online appointment assistance", "₹30–₹100"],
    ["RTI drafting / filing assistance", "₹100–₹300 + applicable fee"],
    ["Rent agreement / affidavit typing support", "Quote after document review"],
  ]},
  { category: "Education, Scholarship & Jobs", items: [
    ["Scholarship eligibility check", "Free–₹49"],
    ["Scholarship application assistance", "₹50–₹150"],
    ["College / university admission form", "₹100–₹300"],
    ["Exam form assistance", "₹50–₹200"],
    ["Government recruitment form", "₹50–₹150"],
    ["Admit card / result print", "₹10–₹30"],
    ["Project report / typing work", "₹200–₹1,000"],
    ["Resume / job profile assistance", "₹100–₹300"],
  ]},
  { category: "Loans, Insurance & Business", items: [
    ["Initial loan / insurance information", "Free"],
    ["Loan document checklist", "₹20–₹99"],
    ["Business project report", "₹500–₹3,000"],
    ["Bank application document support", "₹100–₹500"],
    ["Loan / insurance referral", "Only under authorised partner terms"],
    ["MSME / business registration guidance", "Quote by scope + official fee"],
    ["GST / tax filing support", "Quote by scope + applicable professional fee"],
  ]},
  { category: "Printing & Business Support", items: [
    ["Application / receipt print", "₹10–₹30"],
    ["Business letter / basic typing", "₹50–₹200"],
    ["Invoice / quotation template setup", "₹100–₹500"],
    ["Business plan / DPR assistance", "₹500–₹3,000"],
    ["Digital file organisation", "₹20–₹100"],
  ]},
];

const sources = [
  { name: "MyScheme", url: "https://www.myscheme.gov.in/" },
  { name: "Rajasthan Jan Soochna", url: "https://jansoochna.rajasthan.gov.in/" },
  { name: "Rajasthan e-Mitra", url: "https://emitra.rajasthan.gov.in/" },
];

export default function ServiceRateListPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <Link href="/services" className="text-sm font-bold text-cyan-300 hover:underline">← Browse services</Link>
          <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-cyan-300">YCM ONE • Transparent Pricing</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Service Rate List</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Government scheme guidance, Jan Soochna, e-Mitra support, cyber cafe, education, documents and business assistance — in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://www.myscheme.gov.in/" target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900">MyScheme ↗</a>
            <a href="https://jansoochna.rajasthan.gov.in/" target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/30">Jan Soochna ↗</a>
            <a href="https://emitra.rajasthan.gov.in/" target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/30">e-Mitra ↗</a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Coverage</p><p className="mt-1 text-2xl font-black">8 categories</p><p className="mt-1 text-sm text-slate-600">Starting public rate catalogue</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Pricing promise</p><p className="mt-1 text-2xl font-black">Clear before work</p><p className="mt-1 text-sm text-slate-600">Customer sees the assistance charge first</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Official fees</p><p className="mt-1 text-2xl font-black">Separate</p><p className="mt-1 text-sm text-slate-600">Government / portal charges shown separately</p></div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <b>Pricing note:</b> These are indicative YCM assistance charges, not a government-approved tariff. Government department fees, e-Mitra fees, exam fees, taxes, printing/material costs and third-party charges may be additional and must be disclosed before payment. For e-Mitra transactions, use the current official rate displayed on the authorised portal. Do not charge for a free official service unless a separately described, optional assistance service is being provided.
        </div>

        <div className="mt-8 space-y-5">
          {rates.map((group) => (
            <section key={group.category} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <h2 className="bg-blue-950 px-5 py-4 text-lg font-black text-white">{group.category}</h2>
              <div className="divide-y">
                {group.items.map(([name, price]) => (
                  <div key={name} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm font-black text-blue-800 sm:text-right">{price}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="text-xl font-black">Official portals</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {sources.map((source) => <li key={source.url}><a className="font-bold text-blue-700 underline" href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a> <span className="text-slate-500">— verify eligibility, application status and current official charges here.</span></li>)}
          </ul>
          <p className="mt-4 text-sm text-slate-600">YCM assistance does not guarantee approval or benefit eligibility. Services involving Aadhaar, banking, insurance, loans, legal work or regulated activities are offered only within applicable authorisations and partner rules.</p>
        </section>

        <div className="mt-8 rounded-2xl bg-blue-700 p-6 text-white sm:flex sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-black">Need help choosing a service?</h2><p className="mt-1 text-sm text-blue-100">Talk to a YCM Mitra before submitting documents or making payment.</p></div>
          <Link href="/mitra" className="mt-4 inline-block rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-800 sm:mt-0">Ask YCM Mitra</Link>
        </div>
      </section>
    </main>
  );
}
