import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 5000;
const db = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 2, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field.length === 0) quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (quoted) throw new Error('CSV_INVALID_UNCLOSED_QUOTE');
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row); }
  return rows;
}
function key(s: string) { return s.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function safeCode(s: string) {
  const code = s.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  return code || '';
}
function serviceType(category: string): string {
  const c = category.toLowerCase();
  if (/loan|insurance|banking|finance|pension/.test(c)) return 'financial';
  if (/education|scholarship|job|training|career/.test(c)) return 'education';
  if (/website|e-commerce|digital marketing|franchise|business|msme|startup|tender/.test(c)) return 'business';
  if (/legal|tax|gst|accounting|professional/.test(c)) return 'professional';
  if (/document|certificate|aadhaar|pan|voter|ration|printing|cyber cafe|birth|domicile|caste/.test(c)) return 'document';
  if (/government|scheme|social|welfare|farmer|agriculture|land|housing|labour|health/.test(c)) return 'government';
  return 'other';
}
function domainCode(category: string): string {
  const c = category.toLowerCase();
  if (/government schemes|government services|social welfare|family 360|health schemes/.test(c)) return 'government-services-schemes';
  if (/ration card|food|nutrition/.test(c)) return 'food-nutrition';
  if (/caste|birth|death|domicile|residence|aadhaar|identity|voter|printing|cyber cafe|document|certificate/.test(c)) return 'documents-certificates';
  if (/education|scholarship|jobs|recruitment|resume|career|skill training|training|digital literacy/.test(c)) return 'education-admission-scholarship';
  if (/loan|credit|insurance|banking|financial inclusion|finance/.test(c)) return 'loans-finance-insurance';
  if (/business|startup|msme|website|e-commerce|digital marketing|franchise|tender/.test(c)) return 'business-startup-msme';
  if (/gst|tax|accounting/.test(c)) return 'tax-gst-accounting';
  if (/legal|affidavit/.test(c)) return 'legal-documentation';
  if (/passport|travel/.test(c)) return 'travel-passport-visa-immigration';
  if (/transport/.test(c)) return 'transport-mobility';
  if (/farmer|agriculture/.test(c)) return 'agriculture-farmer';
  if (/labour|worker/.test(c)) return 'labour-worker';
  if (/pension/.test(c)) return 'pension';
  if (/land|property/.test(c)) return 'property-land';
  if (/health/.test(c)) return 'health-medical-discovery';
  if (/utility|electricity|water/.test(c)) return 'utility-services';
  if (/social welfare|women|children|senior/.test(c)) return 'women-children-senior';
  if (/website|digital marketing|e-commerce|franchise|corporate/.test(c)) return 'corporate-business-services';
  if (/digital|cyber cafe|printing/.test(c)) return 'digital-services';
  if (/professional|accounting/.test(c)) return 'professional-services';
  return 'government-services-schemes';
}
export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get(sessionCookieName())?.value);
  if (!session) return NextResponse.json({ success: false, code: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  if (!['ceo', 'admin'].includes(session.role)) return NextResponse.json({ success: false, code: 'FORBIDDEN_BULK_IMPORT_REQUIRES_CEO_OR_ADMIN' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  const dryRun = form.get('dryRun') === 'true';
  if (!(file instanceof File)) return NextResponse.json({ success: false, code: 'CSV_FILE_REQUIRED' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.csv') || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ success: false, code: 'CSV_MUST_BE_UNDER_5MB' }, { status: 413 });
  }

  let matrix: string[][];
  try { matrix = parseCsv(await file.text()); }
  catch (error) { return NextResponse.json({ success: false, code: error instanceof Error ? error.message : 'CSV_PARSE_FAILED' }, { status: 400 }); }
  if (matrix.length < 2) return NextResponse.json({ success: false, code: 'CSV_HAS_NO_DATA_ROWS' }, { status: 400 });
  if (matrix.length - 1 > MAX_ROWS) return NextResponse.json({ success: false, code: 'CSV_ROW_LIMIT_EXCEEDED', maxRows: MAX_ROWS }, { status: 413 });

  const headers = matrix[0].map(key);
  const idx = (...names: string[]) => headers.findIndex(h => names.includes(h));
  const codeIdx = idx('service id', 'service code', 'service code id');
  const nameIdx = idx('service workflow entry', 'service name', 'service');
  const categoryIdx = idx('ycm service category 35', 'category', 'category name');
  const stateIdx = idx('state union territory', 'state ut', 'state');
  const modeIdx = idx('application delivery mode', 'application mode', 'mode');
  const portalIdx = idx('official reference portal', 'official portal service directory link', 'official portal link', 'official link');
  const departmentIdx = idx('responsible department provider', 'responsible department authority', 'department');
  const standardIdx = idx('standard ycm assistance charge', 'standard assistance charge', 'standard ycm assistance charge ₹');
  const discountedIdx = idx('ycm discounted assistance charge', 'ycm discounted assistance charge ₹', 'ycm discounted assistance charge');
  const discountIdx = idx('ycm discount', 'ycm discount');
  const savingsIdx = idx('customer savings', 'customer savings ₹');
  const scopeIdx = idx('core service scope', 'service description', 'description');
  const complianceIdx = idx('compliance pricing note', 'pricing compliance note', 'pricing note');
  const required = [codeIdx, nameIdx, categoryIdx];
  if (required.some(i => i < 0)) return NextResponse.json({
    success: false, code: 'CSV_REQUIRED_COLUMNS_MISSING',
    requiredColumns: ['Service ID', 'Service / Workflow Entry', 'YCM Service Category (35)'],
    receivedHeaders: matrix[0]
  }, { status: 400 });

  const data = matrix.slice(1).map((cells, n) => {
    const get = (i: number) => i < 0 ? '' : String(cells[i] ?? '').trim();
    const code = safeCode(get(codeIdx));
    const name = get(nameIdx).slice(0, 240);
    const category = get(categoryIdx).slice(0, 180) || 'Government Services';
    const standard = Number(get(standardIdx).replace(/[^0-9.]/g, ''));
    const discountedRaw = Number(get(discountedIdx).replace(/[^0-9.]/g, ''));
    const discount = Number(get(discountIdx).replace(/[^0-9.]/g, '')) || 25;
    const discounted = Number.isFinite(discountedRaw) && get(discountedIdx) !== '' ? discountedRaw : Math.round((Number.isFinite(standard) ? standard : 0) * (1 - discount / 100) * 100) / 100;
    return {
      row: n + 2, code, name, category,
      state: get(stateIdx).slice(0, 120),
      mode: get(modeIdx).slice(0, 240),
      portal: get(portalIdx).slice(0, 1000),
      department: get(departmentIdx).slice(0, 240),
      standard: Number.isFinite(standard) && standard >= 0 ? standard : 0,
      discounted: Number.isFinite(discounted) && discounted >= 0 ? discounted : 0,
      discount: Math.max(0, Math.min(100, discount)),
      savings: Number.isFinite(Number(get(savingsIdx).replace(/[^0-9.]/g, ''))) ? Number(get(savingsIdx).replace(/[^0-9.]/g, '')) : Math.max(0, standard - discounted),
      scope: get(scopeIdx).slice(0, 4000),
      compliance: get(complianceIdx).slice(0, 2000)
    };
  });
  const invalidRows = data.filter(r => !r.code || !r.name || !r.category);
  const duplicateCodes = data.filter((r, i) => data.findIndex(x => x.code === r.code) !== i).map(r => r.code);
  if (invalidRows.length || duplicateCodes.length) return NextResponse.json({
    success: false, code: 'CSV_VALIDATION_FAILED',
    invalidRows: invalidRows.slice(0, 20).map(r => r.row),
    duplicateServiceCodes: [...new Set(duplicateCodes)].slice(0, 20),
    rows: data.length
  }, { status: 400 });

  if (dryRun) return NextResponse.json({
    success: true, dryRun: true, rowsValidated: data.length,
    categories: [...new Set(data.map(r => r.category))].length,
    states: [...new Set(data.map(r => r.state).filter(Boolean))].length,
    sample: data.slice(0, 5).map(r => ({ serviceCode: r.code, serviceName: r.name, category: r.category, state: r.state, ycmRate: r.discounted, officialPortal: r.portal }))
  });

  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });
  let imported = 0, skippedExisting = 0;
  try {
    await sql.begin(async tx => {
      for (const item of data) {
        const metadata = {
          source: 'YCM bulk CSV import',
          sourceCategory: item.category,
          stateOrUT: item.state,
          jurisdictionScope: item.state ? 'state_or_ut_specific' : 'all_india',
          officialPortal: item.portal,
          responsibleDepartment: item.department,
          applicationMode: item.mode,
          proposedStandardAssistanceCharge: item.standard,
          ycmDiscountPercent: item.discount,
          ycmDiscountedAssistanceCharge: item.discounted,
          customerSavings: item.savings,
          coreServiceScope: item.scope,
          compliancePricingNote: item.compliance,
          officialFeePolicy: 'Separate; verify actual official fee before customer payment',
          importedAt: new Date().toISOString(),
          publicationReviewRequired: true
        };
        const inserted = await tx`
          INSERT INTO ycm_service_master
            (service_code, service_name, service_type, business_domain_code, channel, requires_case, requires_documents, requires_provider, status, metadata)
          VALUES
            (${item.code}, ${item.name}, ${serviceType(item.category)}, ${domainCode(item.category)}, ${/online/i.test(item.mode) && !/offline/i.test(item.mode) ? 'online' : 'assisted'},
             true, true, ${/loan|insurance|travel|provider/i.test(item.category)}, 'draft', ${JSON.stringify(metadata)}::jsonb)
          ON CONFLICT (service_code) DO NOTHING
          RETURNING service_code
        `;
        if (!inserted.length) { skippedExisting++; continue; }
        await tx`
          INSERT INTO ycm_service_pricing
            (service_code, channel, customer_price, provider_cost, commission_rate, currency, status, metadata)
          VALUES
            (${item.code}, ${/online/i.test(item.mode) && !/offline/i.test(item.mode) ? 'online' : 'assisted'}, ${item.discounted}, 0, null, 'INR', 'active',
             ${JSON.stringify({ standardAssistanceCharge: item.standard, discountPercent: item.discount, customerSavings: item.savings, officialFeesExcluded: true, reviewRequired: true })}::jsonb)
          ON CONFLICT DO NOTHING
        `;
        imported++;
      }
    });
    return NextResponse.json({ success: true, imported, skippedExisting, totalRows: data.length, status: 'draft', message: 'Imported as draft; review official links, rates, legal permissions, and state availability before publication.' });
  } catch (error) {
    return NextResponse.json({ success: false, code: 'SERVICE_CSV_IMPORT_FAILED', message: error instanceof Error ? error.message : 'unknown_error' }, { status: 400 });
  } finally { await sql.end({ timeout: 3 }); }
}
