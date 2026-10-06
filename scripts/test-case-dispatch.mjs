import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const migration = await fs.readFile('database/migrations/047_case_routing.sql','utf8');
const route = await fs.readFile('app/api/operations/case-dispatch/route.ts','utf8');

assert.match(migration,/CREATE TABLE IF NOT EXISTS ycm_case_routing_rules/);
assert.match(migration,/sla_minutes INTEGER NOT NULL DEFAULT 1440/);
assert.match(migration,/team_id UUID NOT NULL REFERENCES ycm_teams/);
assert.match(route,/Deterministic case dispatch/);
assert.match(route,/ycm_case_routing_rules/);
assert.match(route,/open_count/);
assert.match(route,/NO_ROUTING_TEAM/);
assert.match(route,/ycm_case_timeline/);
console.log('CASE_DISPATCH_ROUTING_CONTRACT_TEST: PASS');