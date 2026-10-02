import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const ui = await fs.readFile(path.join(process.cwd(), "app/command-center/page.tsx"), "utf8");
assert.match(ui, /\/api\/impact-proof\/health/);
assert.match(ui, /Production Ready/);
assert.match(ui, /Migration Pending/);
assert.match(ui, /DB Not Configured/);
assert.match(ui, /All Impact tables detected/);
assert.match(ui, /YCM_LIFECYCLE/);
assert.match(ui, /Impact & Proof/);\nassert.match(ui, /State → District → Block/);\nassert.match(ui, /selectedState/);\nassert.match(ui, /selectedDistrict/);\nassert.match(ui, /\/impact-proof\/packet\?district=/);
console.log("COMMAND_CENTER_HEALTH_CONTRACT_TEST: PASS");
