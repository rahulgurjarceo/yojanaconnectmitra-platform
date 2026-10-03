import fs from "node:fs";
const migration = fs.readFileSync("database/migrations/034_service_geography_scope.sql", "utf8");

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

console.log("SERVICE_GEOGRAPHY_SCOPE_CONTRACT_TEST: PASS");
