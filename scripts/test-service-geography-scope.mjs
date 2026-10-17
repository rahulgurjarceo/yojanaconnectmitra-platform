import fs from "node:fs";
const migration = fs.readFileSync("database/migrations/034_service_geography_scope.sql", "utf8");
const route = fs.readFileSync("app/api/service-master/route.ts", "utf8");

for (const token of [
  "ycm_service_geography_scope",
  "state",
  "district",
  "block",
  "gram_panchayat",
  "village",
  "UNIQUE(service_code,geography_level",
  "A service with no rows remains globally discoverable",
]) {
  if (!migration.includes(token)) throw new Error(`Missing service geography contract: ${token}`);
}

for (const token of [
  "stateCode",
  "districtCode",
  "blockCode",
  "gramPanchayatCode",
  "villageCode",
  "GEOGRAPHY_STATE_REQUIRED",
  "GEOGRAPHY_DISTRICT_REQUIRED",
  "GEOGRAPHY_BLOCK_REQUIRED",
  "ycm_service_geography_scope sg",
  "geography_level='village'",
  "geography_level='gram_panchayat'",
  "NOT EXISTS (",
]) {
  if (!route.includes(token)) throw new Error(`Missing service geography entry-gate: ${token}`);
}

console.log("SERVICE_GEOGRAPHY_SCOPE_CONTRACT_TEST: PASS");
