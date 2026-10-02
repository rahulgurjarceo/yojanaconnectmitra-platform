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
assert.match(readme, /npm run db:migrate/);
console.log("Migration runner contract PASS");
