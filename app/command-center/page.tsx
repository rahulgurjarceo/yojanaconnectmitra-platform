'use client';

import { useEffect, useMemo, useState } from 'react';
import { YCM_LIFECYCLE, YCM_MODULES, ModuleStatus } from '../ycm-architecture';

const statusLabel: Record<ModuleStatus,string> = { foundation:'Foundation', partial:'In progress', planned:'Build next' };
const statusClass: Record<ModuleStatus,string> = { foundation:'bg-emerald-50 text-emerald-700 border-emerald-200', partial:'bg-amber-50 text-amber-700 border-amber-200', planned:'bg-slate-100 text-slate-600 border-slate-200' };

export default function CommandCenterPage(){
  const [filter,setFilter] = useState<'all'|ModuleStatus>('all');
  const modules = useMemo(()=>filter==='all'?YCM_MODULES:YCM_MODULES.filter(m=>m.status===filter),[filter]);
  const [assignments, setAssignments] = useState<Array<{assignment_id:string;family_id:string;source_type:string;priority:string;status:string;assignee_name:string|null;reason:string|null;due_at:string|null}>>([]);
  const [opsError, setOpsError] = useState('');
  const [users,setUsers] = useState<Array<{user_id:string;full_name:string|null;role:string}>>([]);
  const [form,setForm] = useState({familyId:'',sourceType:'family',sourceId:'',assignedTo:'',priority:'normal',reason:'',dueAt:''});
  const [saving,setSaving] = useState(false);
  const [saveMessage,setSaveMessage] = useState('');
  const loadAssignments = () => fetch('/api/work-assignments?mine=false', { cache: 'no-store' })
      .then(async r => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.code || 'OPERATIONS_QUEUE_UNAVAILABLE');
        setAssignments(d.assignments || []);
      })
      .catch(e => setOpsError(e instanceof Error ? e.message : 'OPERATIONS_QUEUE_UNAVAILABLE'));
  useEffect(() => { loadAssignments(); fetch('/api/work-assignment-users',{cache:'no-store'}).then(async r=>{const d=await r.json().catch(()=>null); if(!r.ok) throw new Error(d?.code||'ASSIGNMENT_USERS_UNAVAILABLE'); setUsers(d.users||[]);}).catch(()=>setUsers([])); }, []);
  const createAssignment = async (e:React.FormEvent) => { e.preventDefault(); setSaving(true); setSaveMessage(''); try { const r=await fetch('/api/work-assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({familyId:form.familyId.trim(),sourceType:form.sourceType,sourceId:form.sourceId.trim(),assignedTo:form.assignedTo||undefined,priority:form.priority,reason:form.reason.trim()||undefined,dueAt:form.dueAt||undefined})}); const d=await r.json().catch(()=>null); if(!r.ok) throw new Error(d?.code||'ASSIGNMENT_CREATE_FAILED'); setSaveMessage('Assignment created.'); setForm({familyId:'',sourceType:'family',sourceId:'',assignedTo:'',priority:'normal',reason:'',dueAt:''}); loadAssignments(); } catch(e){setSaveMessage(e instanceof Error?e.message:'ASSIGNMENT_CREATE_FAILED')} finally {setSaving(false)} };

  const opsCounts = { assigned: assignments.filter(a=>a.status==='assigned').length, inProgress: assignments.filter(a=>a.status==='in_progress').length, blocked: assignments.filter(a=>a.status==='blocked').length, completed: assignments.filter(a=>a.status==='completed').length };
  const counts = { foundation:YCM_MODULES.filter(m=>m.status==='foundation').length, partial:YCM_MODULES.filter(m=>m.status==='partial').length, planned:YCM_MODULES.filter(m=>m.status==='planned').length };
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-5 py-8"><div className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">YCM ONE</div><div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="text-3xl font-black md:text-5xl">CEO Command Center</h1><p className="mt-2 max-w-3xl text-slate-300">Master control view for the 12-pillar platform. This is the build map, not a demo dashboard.</p></div><div className="flex flex-wrap gap-2"><a href="/impact-proof" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950">Impact & Proof →</a><div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm"><div className="font-bold">35 domains</div><div className="text-slate-400">shared case universe</div></div></div></div></div></header>
    <section className="mx-auto max-w-7xl px-5 py-8"><div className="grid gap-4 md:grid-cols-4"><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Architecture</div><div className="mt-1 text-3xl font-black">12</div><div className="text-xs text-slate-500">master pillars</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Foundation</div><div className="mt-1 text-3xl font-black">{counts.foundation}</div><div className="text-xs text-slate-500">modules with code</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">In progress</div><div className="mt-1 text-3xl font-black">{counts.partial}</div><div className="text-xs text-slate-500">modules being connected</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Build next</div><div className="mt-1 text-3xl font-black">{counts.planned}</div><div className="text-xs text-slate-500">major module areas</div></div></div></section>
    <section className="mx-auto max-w-7xl px-5">
      <div className="rounded-3xl border bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><div className="text-xs font-black uppercase tracking-wider text-blue-700">Live operations</div><h2 className="mt-1 text-2xl font-black">Assignment Control</h2><p className="mt-1 text-sm text-slate-500">Family / case work currently moving through the Mitra network.</p></div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl bg-slate-50 px-3 py-2"><b>{opsCounts.assigned}</b><div>Assigned</div></div>
            <div className="rounded-xl bg-blue-50 px-3 py-2"><b>{opsCounts.inProgress}</b><div>In progress</div></div>
            <div className="rounded-xl bg-red-50 px-3 py-2"><b>{opsCounts.blocked}</b><div>Blocked</div></div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2"><b>{opsCounts.completed}</b><div>Completed</div></div>
          </div>
        </div>
        {opsError ? <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{opsError}</div> : null}
        <form onSubmit={createAssignment} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="text-sm font-black text-blue-800">Create assignment</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input required value={form.familyId} onChange={e=>setForm({...form,familyId:e.target.value})} placeholder="Family ID" className="rounded-xl border bg-white px-3 py-2 text-sm"/>
            <select value={form.sourceType} onChange={e=>setForm({...form,sourceType:e.target.value})} className="rounded-xl border bg-white px-3 py-2 text-sm"><option value="family">Family</option><option value="case">Case</option><option value="document">Document</option><option value="lead">Lead</option><option value="task">Task</option></select>
            <input required value={form.sourceId} onChange={e=>setForm({...form,sourceId:e.target.value})} placeholder="Source ID" className="rounded-xl border bg-white px-3 py-2 text-sm"/>
            <select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} className="rounded-xl border bg-white px-3 py-2 text-sm"><option value="">Unassigned</option>{users.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name||u.user_id} · {u.role}</option>)}</select>
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="rounded-xl border bg-white px-3 py-2 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            <input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})} className="rounded-xl border bg-white px-3 py-2 text-sm"/>
            <input value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Reason / next action" className="rounded-xl border bg-white px-3 py-2 text-sm md:col-span-2"/>
            <button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving?'Creating…':'Create assignment'}</button>
          </div>
          {saveMessage ? <div className="mt-2 text-xs font-semibold text-slate-600">{saveMessage}</div> : null}
        </form>
        <div className="mt-5 space-y-2">
          {assignments.slice(0,12).map(a => <div key={a.assignment_id} className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center">
            <div><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{a.source_type}</span><span className="rounded-full bg-slate-100 px-2 py-1">{a.priority}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{a.status.replace('_',' ')}</span></div><div className="mt-2 font-bold">Family {a.family_id}</div><div className="text-sm text-slate-500">{a.reason || 'Operational assignment'}</div></div>
            <div className="text-right text-xs text-slate-500">{a.assignee_name || 'Unassigned'}{a.due_at ? <div>Due {new Date(a.due_at).toLocaleString()}</div> : null}</div>
          </div>)}
          {!assignments.length && !opsError ? <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No live assignments yet.</div> : null}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5"><div className="rounded-3xl border bg-white p-6"><div className="flex flex-wrap gap-2">{(['all','foundation','partial','planned'] as const).map(x=><button key={x} onClick={()=>setFilter(x)} className={`rounded-full border px-4 py-2 text-sm font-bold ${filter===x?'border-blue-600 bg-blue-600 text-white':'border-slate-200 bg-white text-slate-600'}`}>{x==='all'?'All':statusLabel[x]}</button>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2">{modules.map(m=><article key={m.id} className="rounded-3xl border border-slate-200 p-6"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-black text-blue-700">MODULE {String(m.number).padStart(2,'0')}</span><h2 className="mt-1 text-xl font-black">{m.name}</h2></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass[m.status]}`}>{statusLabel[m.status]}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{m.description}</p><div className="mt-5 flex flex-wrap gap-2">{m.capabilities.map(c=><span key={c} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{c}</span>)}</div><div className="mt-5 rounded-2xl bg-blue-50 p-4"><div className="text-xs font-black uppercase tracking-wider text-blue-700">Next build</div><ul className="mt-2 space-y-1 text-sm text-slate-700">{m.nextBuild.map(x=><li key={x}>→ {x}</li>)}</ul></div></article>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-8"><div className="rounded-3xl bg-white p-6 shadow-sm"><div className="text-xs font-black uppercase tracking-wider text-blue-700">YCM master lifecycle</div><div className="mt-4 flex flex-wrap items-center gap-2">{YCM_LIFECYCLE.map((x,i)=><div key={x} className="flex items-center gap-2"><span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold">{x}</span>{i<YCM_LIFECYCLE.length-1&&<span className="text-slate-300">→</span>}</div>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 pb-12"><div className="rounded-3xl bg-gradient-to-br from-blue-950 to-indigo-950 p-7 text-white"><div className="text-xs font-black uppercase tracking-wider text-cyan-300">Operations command</div><h2 className="mt-2 text-2xl font-black">AI + Door-to-Door + Camps</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><b>AI Mitra</b><p className="mt-1 text-sm text-blue-100">Need intake, opportunity matching and human handoff.</p></div><div className="rounded-2xl bg-white/10 p-4"><b>Door-to-Door</b><p className="mt-1 text-sm text-blue-100">Mitra visits create or update family cases.</p></div><div className="rounded-2xl bg-white/10 p-4"><b>Camps</b><p className="mt-1 text-sm text-blue-100">Bulk registration, document collection and case creation.</p></div></div></div></section>
  </main>;
}
