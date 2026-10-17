import fs from "node:fs/promises";import path from "node:path";import assert from "node:assert/strict";
const root=process.cwd();const m=await fs.readFile(path.join(root,"database/migrations/053_enterprise_lead_routing_cross_sell.sql"),"utf8");const a=await fs.readFile(path.join(root,"app/api/crm/lead-routing/route.ts"),"utf8");
for(const x of ["ycm_lead_routing_rules","ycm_lead_assignments","ycm_lead_cross_sell_recommendations","ycm_lead_routing_events","sla_due_at","attempt_count"])assert.match(m,new RegExp(x));
for(const x of ["distribute","recycle","MAX_ROUTING_ATTEMPTS","NO_ACTIVE_ASSIGNEE","assignment_version"])assert.match(a,new RegExp(x));
console.log("ENTERPRISE_LEAD_ROUTING_CONTRACT_TEST: PASS");