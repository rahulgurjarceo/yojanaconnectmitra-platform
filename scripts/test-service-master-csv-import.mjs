import fs from 'node:fs';
import assert from 'node:assert/strict';

const route = fs.readFileSync('app/api/service-master/import/route.ts', 'utf8');
const panel = fs.readFileSync('app/service-master/csv-import-panel.tsx', 'utf8');
const page = fs.readFileSync('app/service-master/page.tsx', 'utf8');
const migration = fs.readFileSync('database/migrations/018_business_domains_and_team_mapping.sql', 'utf8');
const pricingMigration = fs.readFileSync('database/migrations/021_dynamic_service_operating_layer.sql', 'utf8');

for (const value of [
  'MAX_ROWS = 5000',
  'MAX_FILE_BYTES = 8 * 1024 * 1024',
  'FORBIDDEN_BULK_IMPORT_REQUIRES_CEO_OR_ADMIN',
  'CSV_REQUIRED_COLUMNS_MISSING',
  'CSV_VALIDATION_FAILED',
  'ycm_service_master',
  'ycm_service_pricing',
  "status, metadata)",
  "'draft'",
  'officialPortal',
  'responsibleDepartment',
  'ycmDiscountPercent',
  'officialFeePolicy'
]) assert.ok(route.includes(value), 'CSV importer missing contract: ' + value);

for (const code of [
  'government-services-schemes',
  'documents-certificates',
  'education-admission-scholarship',
  'loans-finance-insurance',
  'business-startup-msme',
  'tax-gst-accounting',
  'legal-documentation',
  'property-land',
  'travel-passport-visa-immigration',
  'agriculture-farmer',
  'food-nutrition',
  'professional-services',
  'digital-services'
]) assert.ok(migration.includes("'" + code + "'"), 'expected valid domain code missing: ' + code);

assert.ok(pricingMigration.includes('CREATE TABLE IF NOT EXISTS ycm_service_pricing'), 'pricing table migration missing');
assert.ok(panel.includes('/api/service-master/import'), 'import UI must call the import endpoint');
assert.ok(panel.includes('Validate CSV') && panel.includes('Import as Drafts'), 'UI must validate before import');
assert.ok(page.includes('ServiceCsvImportPanel'), 'Service Master page must mount CSV import panel');
console.log('SERVICE_MASTER_CSV_IMPORT_CONTRACT_TEST: PASS');
