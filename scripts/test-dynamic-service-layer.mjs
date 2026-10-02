import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const migration=await fs.readFile(path.join(process.cwd(),"database/migrations/021_dynamic_service_operating_layer.sql"),"utf8");
for (const token of [
  "ycm_business_verticals",
  "ycm_service_verticals",
  "ycm_service_providers",
  "ycm_service_provider_links",
  "ycm_service_workflows",
  "ycm_service_documents",
  "ycm_service_pricing"
]) assert.match(migration,new RegExp(token));
assert.match(migration,/credentials\/secrets/i);
assert.match(migration,/CREATE UNIQUE INDEX IF NOT EXISTS idx_ycm_service_workflows_active/);
assert.match(migration,/government/);
assert.match(migration,/agriculture/);
assert.match(migration,/travel/);
console.log("DYNAMIC_SERVICE_OPERATING_LAYER_CONTRACT_TEST: PASS");
