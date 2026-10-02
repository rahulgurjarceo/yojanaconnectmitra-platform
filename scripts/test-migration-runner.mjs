import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const script = await fs.readFile(path.join(root, "scripts/migrate-production.mjs"), "utf8");
const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const readme = await fs.readFile(path.join(root, "database/migrations/README.md"), "utf8");

assert.match(script, /DATABASE_URL \|\| process\.env\.POSTGRES_URL/);
assert.match(script, /ycm_schema_migrations/);
assert.match(script, /pg_advisory_lock/);
assert.match(script, /pg_advisory_unlock/);
assert.match(script, /numeric: true/);
assert.match(script, /await tx\.unsafe\(migration\)/);
assert.match(script, /await tx`INSERT INTO ycm_schema_migrations/);
assert.equal(pkg.scripts["db:migrate"], "node scripts/migrate-production.mjs");
assert.match(readme, /010_ycm_impact_proof\.sql/);
assert.match(readme, /011_ceo_entity_kpi\.sql/);
assert.match(readme, /012_ceo_growth_insights\.sql/);
assert.match(readme, /013_employee_productivity_telemetry\.sql/);
assert.match(readme, /014_employee_compensation_targets\.sql/);
assert.match(readme, /npm run db:migrate/);
console.log("CONTRACT_TEST_PASS");

assert.match(readme, /015_organization_hierarchy_team_lead\.sql/);
assert.match(readme, /016_work_approval_and_org_targets\.sql/);
assert.match(readme, /017_geographic_franchise_targets\.sql/);
assert.match(readme, /018_business_domains_and_team_mapping\.sql/);
const orgMigration = await fs.readFile(path.join(process.cwd(), "database/migrations/015_organization_hierarchy_team_lead.sql"), "utf8");
assert.match(orgMigration, /team_lead/);
assert.doesNotMatch(orgMigration, /CHECK\s*\([^)]*SELECT/);
console.log("ORG_MIGRATION_CONTRACT_TEST: PASS");
const workMigration = await fs.readFile(path.join(process.cwd(), "database/migrations/016_work_approval_and_org_targets.sql"), "utf8");
assert.match(workMigration, /approval_status/);
assert.match(workMigration, /ycm_org_targets/);
assert.match(workMigration, /parent_target_id/);
console.log("WORK_APPROVAL_MIGRATION_CONTRACT_TEST: PASS");

assert.match(readme, /019_unified_service_master\.sql/);
assert.match(readme, /020_unified_franchise_models\.sql/);
assert.match(readme, /021_dynamic_service_operating_layer\.sql/);
const dynamicMigration = await fs.readFile(path.join(process.cwd(), "database/migrations/021_dynamic_service_operating_layer.sql"), "utf8");
assert.match(dynamicMigration, /ycm_service_providers/);
assert.match(dynamicMigration, /ycm_service_workflows/);
console.log("DYNAMIC_SERVICE_MIGRATION_CONTRACT_TEST: PASS");
