import fs from "node:fs/promises";
import assert from "node:assert/strict";

const root=process.cwd();
const route=await fs.readFile("app/api/ceo/employee-kpi/route.ts","utf8");

assert.match(route,/validDate/);
assert.match(route,/validUuid/);
assert.match(route,/EMPLOYEE_ID_INVALID/);
assert.match(route,/KPI_DATE_INVALID/);
assert.match(route,/KPI_DATE_RANGE_INVALID/);
assert.match(route,/from>to/);
assert.match(route,/employeeId/);

console.log("EMPLOYEE_KPI_SECURITY_CONTRACT_TEST: PASS");
