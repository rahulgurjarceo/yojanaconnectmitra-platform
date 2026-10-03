import fs from 'node:fs';

const route = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');
const limiter = fs.readFileSync('app/lib/ycm-login-rate-limit.ts', 'utf8');
const migration = fs.readFileSync('database/migrations/031_auth_login_rate_limit.sql', 'utf8');

for (const [label, source, needles] of [
  ['login route', route, ['loginRateLimited(', 'LOGIN_RATE_LIMITED', 'AUTH_LOGIN_FAILED', 'AUTH_LOGIN_SUCCESS']],
  ['login rate limiter', limiter, ['ycm_auth_login_attempts', 'MAX_REQUESTS_PER_WINDOW', 'request_count']],
  ['security audit wiring', route, ['buildAuditRecord(', 'getPostgresAuditStore(', 'AUTH_LOGIN_FAILED', 'AUTH_LOGIN_SUCCESS']],
  ['audit store', fs.readFileSync('app/lib/ycm-postgres-audit-store.ts', 'utf8'), ['ycm_security_audit_events', 'INSERT INTO']],
  ['login rate-limit migration', migration, ['CREATE TABLE IF NOT EXISTS ycm_auth_login_attempts', 'key_hash', 'window_started_at'] ],
]) {
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`${label}: missing ${needle}`);
  }
}

console.log('Auth login security contract OK');
