import fs from "node:fs";

const migration = fs.readFileSync("database/migrations/053_village_opportunity_intelligence.sql", "utf8");
const route = fs.readFileSync("app/api/management/village-intelligence/route.ts", "utf8");
const page = fs.readFileSync("app/management/village-intelligence/page.tsx", "utf8");

for (const token of [
  "ycm_village_opportunity_profiles",
  "location_id",
  "government_school_count",
  "nearest_government_school_km",
  "bank_branch_count",
  "banking_correspondent_count",
  "insured_population_pct",
  "insurance_service_point_count",
]) {
  if (!migration.includes(token)) throw new Error(`Missing village intelligence schema contract: ${token}`);
}

for (const token of [
  "verifySession",
  "sessionCookieName",
  "ceo","admin","management",
  "bankingGap",
  "insurance",
  "schoolGap",
  ".35",
  ".30",
]) {
  if (!route.includes(token)) throw new Error(`Missing village intelligence API contract: ${token}`);
}

for (const token of [
  "Village Opportunity Intelligence",
  "Banking Gap",
  "Insurance Gap",
  "School Gap",
  "Opportunity Score",
]) {
  if (!page.includes(token)) throw new Error(`Missing village intelligence UI contract: ${token}`);
}

console.log("VILLAGE_OPPORTUNITY_INTELLIGENCE_CONTRACT_TEST: PASS");
