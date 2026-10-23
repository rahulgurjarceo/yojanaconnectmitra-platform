'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Monthly = {month_start:string;revenue_paise:number|string;employee_expense_paise:number|string;office_expense_paise:number|string;marketing_expense_paise:number|string;operations_expense_paise:number|string;total_expense_paise:number|string};
type Expense = {expense_id:string;expense_date:string;category:string;subcategory?:string|null;vendor_name?:string|null;description:string;amount_paise:number|string;tax_paise:number|string;payment_method?:string|null;reference?:string|null;status:string};
type Summary = {monthly:Monthly[];assets:{count:number;current_value_paise:number|string};activeBudgets:{count:number;budget_amount_paise:number|string}};
const categories = [
 ['employee','कर्मचारी / वेतन'],['office','ऑफिस / किराया'],['marketing','मार्केटिंग'],['operations','ऑपरेशन'],['technology','टेक्नोलॉजी / सर्वर'],['travel','यात्रा'],['legal_compliance','कानूनी / अनुपालन'],['asset_purchase','एसेट खरीद'],['bank_payment','बैंक भुगतान'],['other','अन्य']
];
const money=(value:number|string|undefined)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value||0)/100);
const dateLabel=(v:string)=>{try{return new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch{return v}};
export default function CompanyFinanceDashboard(){
 const [summary,setSummary]=useState<Summary|null>(null);
 const [expenses,setExpenses]=useState<Expense[]>([]);
 const [totals,setTotals]=useState<{posted_amount_paise:number|string;draft_amount_paise:number|string;posted_count:number;draft_count:number}|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [showForm,setShowForm]=useState(false);
 const [filter,setFilter]=useState('all');
 const [form,setForm]=useState({category:'office',description:'',amount:'',tax:'0',expenseDate:new Date().toISOString().slice(0,10),vendorName:'',paymentMethod:'bank_transfer',reference:''});

 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const [a,b]=await Promise.all([fetch('/api/finance/company/summary?months=12',{cache:'no-store'}),fetch('/api/finance/company/expenses?limit=150',{cache:'no-store'})]);
   const aj=await a.json().catch(()=>({}));const bj=await b.json().catch(()=>({}));
   if(!a.ok||!aj.success)throw new Error(aj.code||'FINANCE_SUMMARY_LOAD_FAILED');
   if(!b.ok||!bj.success)throw new Error(bj.code||'EXPENSE_LIST_LOAD_FAILED');
   setSummary(aj.data);setExpenses(bj.expenses||[]);setTotals(bj.totals||null);
  }catch(e){setError(e instanceof Error?e.message:'डेटा लोड नहीं हुआ। कृपया लॉगिन/अनुमति और डेटाबेस जाँचें।');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load()},[load]);

 const monthRows=useMemo(()=>[...(summary?.monthly||[])].reverse(),[summary]);
 const latest=summary?.monthly?.[0];
 const monthRevenue=Number(latest?.revenue_paise||0);
 const monthExpense=Number(latest?.total_expense_paise||0);
 const monthOperating=monthRevenue-monthExpense;
 const visibleExpenses=expenses.filter(e=>filter==='all'||e.status===filter);
 const updateForm=(key:string,value:string)=>setForm(prev=>({...prev,[key]:value}));

 async function addExpense(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');setError('');
  const amountPaise=Math.round(Number(form.amount)*100);const taxPaise=Math.round(Number(form.tax)*100);
  if(!form.description.trim()||!Number.isSafeInteger(amountPaise)||amountPaise<=0||!Number.isSafeInteger(taxPaise)||taxPaise<0){setError('विवरण और सही राशि दर्ज करें।');setBusy(false);return;}
  try{
   const response=await fetch('/api/finance/company/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:form.category,description:form.description.trim(),amountPaise,taxPaise,expenseDate:form.expenseDate,vendorName:form.vendorName.trim()||undefined,paymentMethod:form.paymentMethod,reference:form.reference.trim()||undefined})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.success)throw new Error(data.code||'EXPENSE_CREATE_FAILED');
   setMessage('खर्च ड्राफ्ट के रूप में सेव हुआ। अप्रूव/पोस्ट करने के बाद ही रिपोर्ट में वास्तविक खर्च गिना जाएगा।');
   setForm(prev=>({...prev,description:'',amount:'',tax:'0',vendorName:'',reference:''}));setShowForm(false);await load();
  }catch(err){setError(err instanceof Error?err.message:'खर्च सेव नहीं हुआ।');}
  finally{setBusy(false);}
 }
 async function changeStatus(expenseId:string,status:'approved'|'posted'|'cancelled'){
  setBusy(true);setMessage('');setError('');
  try{
   const response=await fetch('/api/finance/company/expenses/approval',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expenseId,status})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.success)throw new Error(data.code||'EXPENSE_STATUS_UPDATE_FAILED');
   setMessage('खर्च की स्थिति अपडेट हो गई।');await load();
  }catch(err){setError(err instanceof Error?err.message:'स्थिति अपडेट नहीं हुई।');}
  finally{setBusy(false);}
 }
 function exportExpenses(){
  const rows=[['Date','Expense ID','Category','Description','Vendor','Amount INR','Tax INR','Status','Payment method','Reference'],...expenses.map(x=>[x.expense_date,x.expense_id,x.category,x.description,x.vendor_name||'',(Number(x.amount_paise)/100).toFixed(2),(Number(x.tax_paise)/100).toFixed(2),x.status,x.payment_method||'',x.reference||''])];
  const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='YCM_Company_Expenses.csv';a.click();URL.revokeObjectURL(url);
 }

 return <main className="min-h-screen bg-slate-50 text-slate-900">
  <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 text-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
   <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-200">YOJANA CONNECT MITRA PVT. LTD.</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Company Finance Dashboard</h1><p className="mt-2 max-w-2xl text-sm text-blue-100">वास्तविक डेटाबेस रिपोर्ट, खर्च रजिस्टर और मासिक ऑपरेटिंग परिणाम। केवल अधिकृत CEO / Management / Admin उपयोग के लिए।</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>setShowForm(v=>!v)} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950">{showForm?'फॉर्म बंद करें':'+ खर्च जोड़ें'}</button><button onClick={()=>void load()} className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold hover:bg-white/10">↻ Refresh</button></div></div>
  </div></header>
  <section className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
   {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">डेटा/एक्शन त्रुटि: {error}<p className="mt-1 font-normal">सुनिश्चित करें कि आप लॉगिन हैं और आपकी भूमिका CEO, Management या Admin है। यह पेज लॉगिन या अनुमतियों को बायपास नहीं करता।</p></div>}
   {message&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div>}
   {showForm&&<form onSubmit={addExpense} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">कंपनी खर्च दर्ज करें</h2><p className="mt-1 text-sm text-slate-500">राशि रुपये में डालें। नया रिकॉर्ड पहले draft बनेगा।</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <label className="text-sm font-semibold">खर्च श्रेणी<select value={form.category} onChange={e=>updateForm('category',e.target.value)} className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5">{categories.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <label className="text-sm font-semibold">राशि (₹)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>updateForm('amount',e.target.value)} className="mt-1 block w-full rounded-xl border px-3 py-2.5"/></label>
    <label className="text-sm font-semibold">टैक्स राशि (₹)<input type="number" min="0" step="0.01" value={form.tax} onChange={e=>updateForm('tax',e.target.value)} className="mt-1 block w-full rounded-xl border px-3 py-2.5"/></label>
    <label className="text-sm font-semibold">खर्च की तारीख<input required type="date" value={form.expenseDate} onChange={e=>updateForm('expenseDate',e.target.value)} className="mt-1 block w-full rounded-xl border px-3 py-2.5"/></label>
    <label className="text-sm font-semibold">वेंडर / कर्मचारी<input maxLength={180} value={form.vendorName} onChange={e=>updateForm('vendorName',e.target.value)} className="mt-1 block w-full rounded-xl border px-3 py-2.5"/></label>
    <label className="text-sm font-semibold">भुगतान माध्यम<select value={form.paymentMethod} onChange={e=>updateForm('paymentMethod',e.target.value)} className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5"><option value="bank_transfer">Bank transfer</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></select></label>
    <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">विवरण<input required maxLength={1000} value={form.description} onChange={e=>updateForm('description',e.target.value)} placeholder="जैसे अक्टूबर ऑफिस किराया / इंटरनेट बिल" className="mt-1 block w-full rounded-xl border px-3 py-2.5"/></label>
    <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">बिल / बैंक रेफरेंस (वैकल्पिक)<input maxLength={180} value={form.reference} onChange={e=>updateForm('reference',e.target.value)} className="mt-1 block w-full rounded-xl border px-3 py-2.5"/></label>
   </div><button disabled={busy} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-50">{busy?'सेव हो रहा है…':'Draft खर्च सेव करें'}</button></form>}

   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">इस महीने का दर्ज राजस्व</p><p className="mt-2 text-2xl font-black">{money(latest?.revenue_paise)}</p><p className="mt-1 text-xs text-slate-400">Posted revenue + successful financial ledger entries</p></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">इस महीने के दर्ज खर्च</p><p className="mt-2 text-2xl font-black">{money(latest?.total_expense_paise)}</p><p className="mt-1 text-xs text-slate-400">Approved / posted expenses only</p></div>
    <div className={`rounded-2xl border p-5 shadow-sm ${monthOperating>=0?'bg-emerald-50':'bg-rose-50'}`}><p className="text-sm text-slate-600">सरल ऑपरेटिंग अंतर</p><p className="mt-2 text-2xl font-black">{money(monthOperating*1)}</p><p className="mt-1 text-xs text-slate-500">Revenue − recorded expense; audited net profit नहीं</p></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">दर्ज कंपनी एसेट</p><p className="mt-2 text-2xl font-black">{money(summary?.assets?.current_value_paise)}</p><p className="mt-1 text-xs text-slate-400">{summary?.assets?.count??0} active/non-disposed asset records</p></div>
   </div>

   <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">मासिक रिपोर्ट — पिछले 12 महीने</h2><p className="mt-1 text-sm text-slate-500">डेटाबेस में दर्ज रकम के आधार पर।</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{monthRows.length} महीने</span></div>
     {loading?<p className="py-10 text-center text-slate-500">रिपोर्ट लोड हो रही है…</p>:<div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="px-3 py-3">महीना</th><th className="px-3 py-3">राजस्व</th><th className="px-3 py-3">खर्च</th><th className="px-3 py-3">अंतर</th></tr></thead><tbody className="divide-y">{monthRows.map(m=>{const rev=Number(m.revenue_paise||0),exp=Number(m.total_expense_paise||0);return <tr key={m.month_start}><td className="whitespace-nowrap px-3 py-3 font-semibold">{new Date(m.month_start).toLocaleDateString('en-IN',{month:'short',year:'numeric',timeZone:'UTC'})}</td><td className="whitespace-nowrap px-3 py-3">{money(rev)}</td><td className="whitespace-nowrap px-3 py-3">{money(exp)}</td><td className={`whitespace-nowrap px-3 py-3 font-bold ${rev-exp>=0?'text-emerald-700':'text-rose-700'}`}>{money(rev-exp)}</td></tr>})}</tbody></table></div>}
    </div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Expense Register सारांश</h2><p className="mt-1 text-sm text-slate-500">सभी दर्ज खर्चों की स्थिति।</p><div className="mt-4 space-y-3"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Approved / Posted</p><p className="mt-1 text-2xl font-black text-emerald-950">{money(totals?.posted_amount_paise)}</p><p className="text-xs text-emerald-800">{totals?.posted_count??0} रिकॉर्ड</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-sm text-amber-800">Draft — अभी रिपोर्ट में नहीं गिना</p><p className="mt-1 text-2xl font-black text-amber-950">{money(totals?.draft_amount_paise)}</p><p className="text-xs text-amber-800">{totals?.draft_count??0} रिकॉर्ड</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Active budgets</p><p className="mt-1 text-2xl font-black">{summary?.activeBudgets?.count??0}</p><p className="text-xs text-slate-500">कुल बजट {money(summary?.activeBudgets?.budget_amount_paise)}</p></div></div></div>
   </div>

   <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="text-xl font-black">कंपनी खर्च रजिस्टर</h2><p className="mt-1 text-sm text-slate-500">Draft खर्च को approve, फिर post करें। पोस्ट किए गए रिकॉर्ड रिपोर्ट में शामिल होंगे।</p></div><div className="flex flex-wrap gap-2"><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm"><option value="all">सभी स्थिति</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="posted">Posted</option><option value="cancelled">Cancelled</option></select><button onClick={exportExpenses} className="rounded-xl border px-3 py-2 text-sm font-bold">CSV डाउनलोड ↓</button></div></div>
    {loading?<p className="p-8 text-center text-slate-500">खर्च लोड हो रहे हैं…</p>:visibleExpenses.length===0?<p className="p-8 text-center text-slate-500">अभी कोई खर्च रिकॉर्ड नहीं मिला। “+ खर्च जोड़ें” से पहला रिकॉर्ड डालें।</p>:<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="px-4 py-3">तारीख</th><th className="px-4 py-3">विवरण</th><th className="px-4 py-3">श्रेणी</th><th className="px-4 py-3">राशि</th><th className="px-4 py-3">स्थिति</th><th className="px-4 py-3">एक्शन</th></tr></thead><tbody className="divide-y">{visibleExpenses.map(x=><tr key={x.expense_id} className="align-top hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3">{dateLabel(x.expense_date)}</td><td className="min-w-64 px-4 py-3"><b>{x.description}</b><p className="mt-1 text-xs text-slate-500">{x.vendor_name||'वेंडर दर्ज नहीं'} {x.reference? '• '+x.reference:''}</p></td><td className="whitespace-nowrap px-4 py-3">{categories.find(c=>c[0]===x.category)?.[1]||x.category}</td><td className="whitespace-nowrap px-4 py-3 font-bold">{money(x.amount_paise)}<p className="text-xs font-normal text-slate-500">Tax {money(x.tax_paise)}</p></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${x.status==='posted'?'bg-emerald-100 text-emerald-800':x.status==='approved'?'bg-blue-100 text-blue-800':x.status==='draft'?'bg-amber-100 text-amber-800':'bg-slate-100 text-slate-600'}`}>{x.status}</span></td><td className="min-w-44 px-4 py-3"><div className="flex flex-wrap gap-2">{x.status==='draft'&&<><button disabled={busy} onClick={()=>void changeStatus(x.expense_id,'approved')} className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Approve</button><button disabled={busy} onClick={()=>void changeStatus(x.expense_id,'cancelled')} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-50">Cancel</button></>}{x.status==='approved'&&<><button disabled={busy} onClick={()=>void changeStatus(x.expense_id,'posted')} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Post</button><button disabled={busy} onClick={()=>void changeStatus(x.expense_id,'cancelled')} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-50">Cancel</button></>}{x.status!=='draft'&&x.status!=='approved'&&<span className="text-xs text-slate-400">No action</span>}</div></td></tr>)}</tbody></table></div>}
   </div>
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><b>Accounting note:</b> यह प्रबंधन डैशबोर्ड है, audited P&L या statutory balance sheet नहीं। मौजूदा monthly view revenue और financial ledger के बीच संभावित overlap/duplicate counting से बचाने के लिए reconciliation review माँगता है; tax, refunds, depreciation, liabilities और accruals की पूरी accounting अलग से verify करें। कोई वित्तीय रिकॉर्ड डालने से पहले बिल/बैंक सबूत मिलाएँ।</div>
  </section>
 </main>;
}
