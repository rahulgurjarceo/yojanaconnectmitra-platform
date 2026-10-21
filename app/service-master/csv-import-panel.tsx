'use client';
import { useState } from 'react';

type ImportResult = {
  success?: boolean;
  code?: string;
  message?: string;
  dryRun?: boolean;
  rowsValidated?: number;
  categories?: number;
  states?: number;
  imported?: number;
  skippedExisting?: number;
  totalRows?: number;
  requiredColumns?: string[];
  invalidRows?: number[];
  duplicateServiceCodes?: string[];
  sample?: Array<{serviceCode:string;serviceName:string;category:string;state:string;ycmRate:number;officialPortal:string}>;
};

export default function ServiceCsvImportPanel({ onImported }: { onImported?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [checked, setChecked] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  async function submit(dryRun: boolean) {
    if (!file) { setError('Pehle CSV file select karein.'); return; }
    setError('');
    setResult(null);
    if (dryRun) setChecking(true); else setImporting(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('dryRun', String(dryRun));
      const response = await fetch('/api/service-master/import', { method: 'POST', body, cache: 'no-store' });
      const json = await response.json() as ImportResult;
      if (!response.ok || !json.success) throw new Error(json.code || json.message || 'CSV import failed');
      if (dryRun) setChecked(json);
      else { setResult(json); setChecked(null); onImported?.(); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CSV import failed');
    } finally { setChecking(false); setImporting(false); }
  }

  return <section className="mb-5 rounded-3xl border border-blue-200 bg-blue-50 p-5">
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div><div className="text-xs font-black uppercase tracking-wider text-blue-700">Bulk Service Master</div>
        <h2 className="mt-1 text-xl font-black">Import up to 5,000 services from CSV</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">First validate the file. Import creates draft services and proposed YCM prices; it does not publish them to customers automatically.</p>
      </div>
      <a className="text-sm font-bold text-blue-800 underline" href="/service-rates">View public rate-list page</a>
    </div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <input type="file" accept=".csv,text/csv" onChange={e=>{setFile(e.target.files?.[0]||null);setChecked(null);setResult(null);setError('');}} className="block w-full rounded-xl border bg-white p-2 text-sm"/>
      <button disabled={!file||checking||importing} onClick={()=>void submit(true)} className="rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-black disabled:opacity-50">{checking?'Validating…':'1. Validate CSV'}</button>
      <button disabled={!file||!checked||importing||checking} onClick={()=>void submit(false)} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{importing?'Importing…':'2. Import as Drafts'}</button>
    </div>
    {error&&<p role="alert" className="mt-3 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">{error}</p>}
    {checked&&<div className="mt-3 rounded-xl border border-blue-200 bg-white p-4 text-sm">
      <p className="font-black text-green-800">Validation passed: {checked.rowsValidated?.toLocaleString()} rows</p>
      <p className="mt-1 text-slate-600">{checked.categories} categories · {checked.states} states/UTs detected. Review sample before importing.</p>
      <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-xs"><thead><tr className="border-b"><th className="p-2">Service ID</th><th className="p-2">Service</th><th className="p-2">State</th><th className="p-2">YCM ₹</th></tr></thead><tbody>{checked.sample?.map(s=><tr key={s.serviceCode} className="border-b"><td className="p-2">{s.serviceCode}</td><td className="p-2">{s.serviceName}</td><td className="p-2">{s.state||'All India'}</td><td className="p-2">{s.ycmRate}</td></tr>)}</tbody></table></div>
    </div>}
    {result&&<p className="mt-3 rounded-xl border border-green-200 bg-white p-4 text-sm font-bold text-green-800">Import complete: {result.imported?.toLocaleString()} created as drafts; {result.skippedExisting?.toLocaleString()} existing Service IDs skipped. Total processed: {result.totalRows?.toLocaleString()}. Review links and rates before publishing.</p>}
    <p className="mt-3 text-xs leading-5 text-slate-600">CSV import is restricted to CEO/Admin. Maximum 5 MB and 5,000 rows. Government/third-party charges stay separate. Validate each official URL, state availability, rate, and authorization before publishing.</p>
  </section>;
}
