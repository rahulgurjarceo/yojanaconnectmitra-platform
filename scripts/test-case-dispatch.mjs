import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const migration = await fs.readFile('database/migrations/047_case_routing.sql','utf8');
const route = await fs.readFile('app/api/operations/case-dispatch/route.ts','utf8');
const service = await fs.readFile('app/lib/case-dispatch.ts','utf8');
const resources = await fs.readFile('app/api/customer-family/resources/route.ts','utf8');

assert.match(migration,/CREATE TABLE IF NOT EXISTS ycm_case_routing_rules/);
assert.match(migration,/sla_minutes INTEGER NOT NULL DEFAULT 1440/);
assert.match(migration,/team_id UUID NOT NULL REFERENCES ycm_teams/);
assert.match(service,/LEFT JOIN ycm_service_applications a ON a.application_id=c.application_id/);
assert.doesNotMatch(service,/c\.service_code/);
assert.match(service,/ycm_case_routing_rules/);
assert.match(service,/open_count/);
assert.match(service,/NO_ROUTING_TEAM/);
assert.match(service,/ycm_case_timeline/);
assert.match(route,/dispatchCase/);
assert.match(resources,/dispatchCase/);
assert.match(resources,/dispatchPending/);
console.log('CASE_DISPATCH_ROUTING_CONTRACT_TEST: PASS');
