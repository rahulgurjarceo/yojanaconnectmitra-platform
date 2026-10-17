# YCM ONE — Hostinger Test Deployment Checklist

This checklist is for a separate staging/test deployment. Do not overwrite an existing employee or production environment without an agreed change window.

## 1. Confirm hosting compatibility
- Confirm the Hostinger plan supports the Node.js/Next.js runtime required by this repository.
- The current Next.js configuration uses standalone output.
- Confirm the target subdomain and deployment folder before uploading or connecting a deployment.

## 2. Configure application settings
The readiness route reads:
- DATABASE_URL or POSTGRES_URL — PostgreSQL connection string.
- YCM_SESSION_SECRET — server-side session secret, at least 32 characters.

Set values in the hosting control panel, not in committed source files. Never commit real credentials.

## 3. Database preparation
- Provision or select a non-production PostgreSQL database.
- Confirm the application host can connect to it.
- Take a backup before any migration.
- Rehearse migrations against a disposable/staging database first.
- Record which migrations were executed and the result.
- Verify that the required ycm_revoked_sessions and ycm_security_audit_events tables exist.

Do not run migrations against production until the target, backup, restore plan, and change approval have been checked.

## 4. Build and deploy
From the repository root:
```bash
npm install
npm run lint
npm run build
npm run start
```

Run the build against the exact commit planned for staging. Check CI for that same commit before deployment.

## 5. Verify the running app
- Open the staging URL and check the main page and key navigation.
- Request /api/ready. HTTP 200 means the readiness checks passed; HTTP 503 means one or more dependencies are not ready.
- Test login and family/service/case flows using test data only.
- Review application logs for errors.
- Confirm rollback steps before exposing the URL to external users.

## 6. Known external blocker
The current customer/family OTP provider factory returns null. Real SMS OTP is not enabled until a provider adapter and credentials are configured. Payment, AEPS, IVR, DigiLocker and government integrations also require their own credentials and provider/UAT checks.

A successful build does not prove that these external integrations work. Do not advertise the system as production-ready until the relevant live checks are complete.
